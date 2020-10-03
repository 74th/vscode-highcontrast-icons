import * as xml from "xml-js";
import * as path from "path";
import * as yaml from "yaml";
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
    // materialIcons?: string
    tablerIcons?: string
    color: string
    folderNames?: string[]
    fileExtensions?: string[]
    fileNames?: string[]
    languageIds?: string[]
    file?: boolean,
    folder?: boolean
    folderExpanded?: boolean
}


async function copySimpleIcon(name: string, icon: string, color: string) {

    const f = await fs.readFile(`simple-icons/icons/${icon}.svg`);
    const body = xml.xml2js(f.toString());
    const svg = body.elements[0] as xml.Element;
    const path = svg.elements[1] as xml.Element;
    path.attributes.fill = color;
    fs.writeFile(`fileicons/${name}.svg`, xml.js2xml(body))
}

async function copyTablerIcon(name: string, icon: string, color: string) {
    const f = await fs.readFile(`tabler-icons/icons/${icon}.svg`);
    const body = xml.xml2js(f.toString());
    const svg = body.elements[0] as xml.Element;
    svg.attributes.stroke = color;
    fs.writeFile(`fileicons/${name}.svg`, xml.js2xml(body))
}


async function main() {

    await child_process.exec("cp ./");

    const manifest = {
        iconDefinitions: {},
        // fonts: [
        //     {
        //         id: "material-icons",
        //         src: [{
        //             path: "../material-design-icons/font/MaterialIconsOutlined-Regular.otf",
        //             format: "otf"
        //         }]
        //     }
        // ],
        folderNames: {},
        fileExtensions: {},
        fileNames: {},
        languageIds: {},
    } as FileIconSet;

    let html = `<html><head>`
    html += `<style "text/css">`;
    html += `body { background-color: black; color: white; font-size: 13px;}`;
    html += `img { height: 14px; }`;
    html += `</style>`;
    html += `<link rel="stylesheet" href="node_modules/tabler-icons/iconfont/tabler-icons.css">`;
    html += `</head><body><ul>`;


    const defGroupss = yaml.parse((await fs.readFile("definitions.yaml")).toString()) as { [index: string]: Definition }

    for (const groupName in defGroupss) {
        const defs = defGroupss[groupName];

        try {
            await fs.stat(path.join("samples", groupName));
        } catch (e) {
            fs.mkdir(path.join("samples", groupName));
        }

        html += `<h2>${groupName}</h2>`

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

            html += `<li>`

            if (def.simpleIcons) {
                await copySimpleIcon(name, def.simpleIcons, def.color);
                manifest.iconDefinitions[iconName] = {
                    iconPath: `${name}.svg`,
                }
                html += `<img src="./fileicons/${name}.svg" />`
            }

            // if (def.materialIcons) {
            //     manifest.iconDefinitions[iconName] = {
            //         fontId: "material-icons",
            //         fontCharacter: def.materialIcons,
            //         fontColor: def.color,
            //     }
            //     html += `<li><span class="material-icons">${def.materialIcons}</span>  ${name}</li>`
            // }
            if (def.tablerIcons) {
                await copyTablerIcon(name, def.tablerIcons, def.color);
                manifest.iconDefinitions[iconName] = {
                    iconPath: `${name}.svg`,
                };
                html += `<img src="./fileicons/${name}.svg" />`;
            }
            html += ` ${name} ... `;
            html += assigned.join(" ");
            html += `</li>`;

            let sampleFileName = "";
            if (def.fileExtensions) {
                sampleFileName = `${name}.${def.fileExtensions[0]}`;
            } else if (def.fileNames) {
                sampleFileName = def.fileNames[0];
            }
            if (sampleFileName.length) {
                await fs.writeFile(path.join("samples", groupName, sampleFileName), name);
            }
        }
    }

    html += `</ul></body></html>`;

    await fs.writeFile("fileicons/definitions.json", JSON.stringify(manifest));
    await fs.writeFile("definitions.html", html);
}

const p = main();
p.then(() => {
    console.log("done");
});
