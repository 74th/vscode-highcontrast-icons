import * as xml from "xml-js";
import * as yaml from "yaml";
import { promises as fs } from "fs";

interface FileIconSet {
    iconDefinitions: {
        [index: string]: {
            iconPath: string,
        }
    },
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
    color: string
    folderNames?: string[]
    fileExtensions?: string[]
    fileNames?: string[]
    languageIds?: string[]
    file?: string,
    folder?: string
    folderExpanded?: string
}


async function copySimpleIcon(name: string, icon: string, color: string) {

    const f = await fs.readFile(`simple-icons/icons/${icon}.svg`);
    const body = xml.xml2js(f.toString());
    const svg = body.elements[0] as xml.Element;
    const path = svg.elements[1] as xml.Element;
    path.attributes.fill = color;
    fs.writeFile(`fileicons/${name}.svg`, xml.js2xml(body))
}


async function main() {
    const manifest = {
        iconDefinitions: {},
        folderNames: {},
        fileExtensions: {},
        fileNames: {},
        languageIds: {},
    } as FileIconSet;

    let html = `<html><head><style "text/css">`;
    html += `body { background-color: black; color: white; font-size: 13px;}`;
    html += `img { height: 14px; }`
    html += `</style></head><body><ul>`;

    const defs = yaml.parse((await fs.readFile("definition.yaml")).toString()) as { [index: string]: Definition }

    for (const name in defs) {

        console.log(name);

        const def = defs[name];

        const iconName = `_${name}`;

        if (def.simpleIcons) {
            await copySimpleIcon(name, def.simpleIcons, def.color);
            manifest.iconDefinitions[iconName] = {
                iconPath: `${name}.svg`,
            }
        }

        html += `<li><img src="./${name}.svg" />  ${name}</li>`

        if (def.folderNames) {
            def.folderNames.forEach((id) => {
                manifest.folderNames[id] = iconName;
            });
        }
        if (def.fileExtensions) {
            def.fileExtensions.forEach((id) => {
                manifest.fileExtensions[id] = iconName;
            });
        }
        if (def.fileNames) {
            def.fileNames.forEach((id) => {
                manifest.fileNames[id] = iconName;
            });
        }
        if (def.languageIds) {
            def.languageIds.forEach((id) => {
                manifest.languageIds[id] = iconName;
            });
        }
        if (def.file) {
            manifest.file = iconName;
        }
        if (def.folder) {
            manifest.folder = iconName;
        }
        if (def.folderExpanded) {
            manifest.folderExpanded = iconName;
        }
    }

    html += `</ul></body></html>`;

    await fs.writeFile("fileicons/definitions.json", JSON.stringify(manifest));
    await fs.writeFile("fileicons/definitions.html", html);
}

const p = main();
p.then(() => {
    console.log("done");
});
