import * as xml from "xml-js";
import * as path from "path";
import * as yaml from "yaml";
import * as color from "color-convert";
import { promises as fs } from "fs";
import * as child_process from "child_process";

interface FileIconSet {
    iconDefinitions: {
        [index: string]: {
            iconPath?: string,
            fontCharacter?: string,
            fontColor?: string,
            fontSize?: string,
            fontId?: string,
        }
    },
    fonts?: {
        id: string,
        src: { path: string, format: string }[],
    }[],
    file?: string,
    folder?: string
    folderExpanded?: string
    folderNames: { [index: string]: string },
    fileExtensions: { [index: string]: string },
    fileNames: { [index: string]: string },
    languageIds: { [index: string]: string },
}

interface Definition {
    simpleIcons?: string
    tablerIcons?: string
    color: string
    lightColor?: string
    folderNames?: string[]
    fileExtensions?: string[]
    fileNames?: string[]
    languageIds?: string[]
    file?: boolean,
    folder?: boolean
    folderExpanded?: boolean
}


async function copySimpleIcon(name: string, icon: string, darkColor: string, lightColor?: string) {

    const f = await fs.readFile(`simple-icons/icons/${icon}.svg`);
    const body = xml.xml2js(f.toString());
    const svg = body.elements[0] as xml.Element;
    const path = svg.elements![1] as xml.Element;

    path.attributes!.fill = darkColor;
    fs.writeFile(`dark/${name}.svg`, xml.js2xml(body))

    if (!lightColor) {
        lightColor = dark2light(darkColor);
    }
    path.attributes!.fill = lightColor;
    fs.writeFile(`light/${name}.svg`, xml.js2xml(body))
}

async function copyTablerIcon(name: string, icon: string, darkColor: string, lightColor?: string) {
    const f = await fs.readFile(`tabler-icons/icons/${icon}.svg`);
    const body = xml.xml2js(f.toString());
    const svg = body.elements[0] as xml.Element;

    svg.attributes!.stroke = darkColor;
    fs.writeFile(`dark/${name}.svg`, xml.js2xml(body))

    if (!lightColor) {
        lightColor = dark2light(darkColor);
    }
    svg.attributes!.stroke = dark2light(darkColor);
    fs.writeFile(`light/${name}.svg`, xml.js2xml(body))
}

function dark2light(colorCode: string): string {
    const darkHex = colorCode.substring(1);
    const darkHsv = color.hex.hsv(darkHex);
    const lightHsv = [darkHsv[0], darkHsv[2], darkHsv[1]];
    const lightHex = color.hsv.hex([lightHsv[0], lightHsv[1], lightHsv[2]]);
    return `#${lightHex}`;
}

async function main() {

    await child_process.exec("rm -rf dark/*");
    await child_process.exec("rm -rf light/*");
    await child_process.exec("rm -rf samples/*");

    const manifest = {
        iconDefinitions: {},
        folderNames: {},
        fileExtensions: {},
        fileNames: {},
        languageIds: {},
    } as FileIconSet;

    const defGroupss = yaml.parse((await fs.readFile("definitions.yaml")).toString()) as { [index: string]: { [index: string]: Definition } };

    for (const groupName in defGroupss) {
        const defs = defGroupss[groupName];

        try {
            await fs.stat(path.join("samples", groupName));
        } catch (e) {
            fs.mkdir(path.join("samples", groupName));
        }

        for (const name in defs) {

            console.log(name);

            const def = defs[name];

            const iconName = `_${name}`;

            const assigned: string[] = [];

            if (def.languageIds) {
                def.languageIds.forEach((id) => {
                    manifest.languageIds[id] = iconName;
                    assigned.push(`[${id}]`);
                });
            }
            if (def.folderNames) {
                def.folderNames.forEach((id) => {
                    manifest.folderNames[id] = iconName;
                    assigned.push(id);
                });
            }
            if (def.fileExtensions) {
                def.fileExtensions.forEach((id) => {
                    manifest.fileExtensions[id] = iconName;
                    assigned.push(`.${id}`);
                });
            }
            if (def.fileNames) {
                def.fileNames.forEach((id) => {
                    manifest.fileNames[id] = iconName;
                    assigned.push(id);
                });
            }
            if (def.file) {
                manifest.file = iconName;
                assigned.push("file");
            }
            if (def.folder) {
                manifest.folder = iconName;
                assigned.push("folder");
            }
            if (def.folderExpanded) {
                manifest.folderExpanded = iconName;
                assigned.push("folderExpanded");
            }


            if (def.simpleIcons) {
                await copySimpleIcon(name, def.simpleIcons, def.color, def.lightColor);
                manifest.iconDefinitions[iconName] = {
                    iconPath: `${name}.svg`,
                }
            }

            if (def.tablerIcons) {
                await copyTablerIcon(name, def.tablerIcons, def.color, def.lightColor);
                manifest.iconDefinitions[iconName] = {
                    iconPath: `${name}.svg`,
                };
            }

            let sampleFileName = "";
            if (def.fileExtensions) {
                sampleFileName = `${name}.${def.fileExtensions[0]}`;
            } else if (def.fileNames) {
                sampleFileName = def.fileNames[0];
            } else if (def.file) {
                sampleFileName = "file";
            }
            if (sampleFileName.length) {
                await fs.writeFile(path.join("samples", groupName, sampleFileName), name);
            }
        }
    }


    await fs.writeFile("dark/manifest.json", JSON.stringify(manifest));
    await fs.writeFile("light/manifest.json", JSON.stringify(manifest));
}

const p = main();
p.then(() => {
    console.log("done");
});
