import fs from "fs";
import path from "path";
import chalk from "chalk";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import z from "zod";


const ApplicationSchema = z.object({
    folderName: z.string().describe(
        "Kebab-case root folder name of the application"
    ),

    name: z.string().describe(
        "Human-readable application name"
    ),

    description: z.string().describe(
        "Short description of the application"
    ),

    files: z.array(
        z.object({
            path: z.string().describe(
                "Relative file path (e.g. src/index.ts)"
            ),
            content: z.string().describe(
                "Complete file content"
            )
        })
    ).min(1),

    setUpCommand: z.array(
        z.string().describe(
            "Shell commands to install and run the app"
        )
    ).min(1)
});



function printSystem(message) {
    console.log(chalk.blue(message));
}

function displayFileTree(files, folderName) {
    printSystem(chalk.cyan("Project Structure:"));
    printSystem(chalk.white(`Folder: ${folderName}`));

    const filesByDir = {};

    files.forEach(file => {
        const parts = file.path.split('/');
        const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
        const fileName = parts[parts.length - 1];

        if (!filesByDir[dir]) {
            filesByDir[dir] = [];
        }
        filesByDir[dir].push(fileName);
    });

    Object.keys(filesByDir).sort().forEach(dir => {
        if (dir) {
            printSystem(chalk.white(`|- ${dir}/`));
            filesByDir[dir].forEach(fileName => {
                printSystem(chalk.white(`|  └── ${fileName}`));
            });
        } else {
            // Root files
            filesByDir[dir].forEach(fileName => {
                printSystem(chalk.white(`|-- ${fileName}`));
            });
        }
    });
}

async function createApplicationFiles(baseDir, folderName, files) {
    const appDir = path.join(baseDir, folderName);
    await fs.mkdirSync(appDir, { recursive: true });
    printSystem(chalk.cyan(`Creating directory ${folderName}/`));

    for (const file of files) {
        const filePath = path.join(appDir, file.path);
        const dir = path.dirname(filePath);

        await fs.mkdirSync(dir, { recursive: true });
        await fs.writeFile(filePath, file.content, 'utf-8');
        printSystem(chalk.green(`Created file ${filePath}`));
    }

    return appDir;
}


export async function generateApplication(description, aiService, cwd = process.cwd()) {
    try {
        printSystem(chalk.cyan("Agent mode: Generating Application...\n"));
        printSystem(chalk.white(`Request: ${description}\n`));

        const model = google(aiService.modelName);
        const result = await generateObject({
            model,
            schema: ApplicationSchema,
            prompt: `Create a complete, production-ready application for: ${description} CRITICAL REQUIREMENTS: 
            Generate ALL files needed for the application to run Include package.json with ALL dependencies and correct versions Include a README.md with clear setup instructions Include configuration files (e.g. .gitignore, etc.) 
            Write clean, well-commented, production-ready code Include proper error handling and input validation Use modern JavaScript / TypeScript best practices Make sure all imports and paths are correct NO PLACEHOLDERS — everything must be complete and working Provide: A meaningful kebab-case folder name All necessary files with complete content Setup commands (cd into folder, npm install, npm run dev, etc.) All dependencies listed with exact versions`
        })
        if (!result?.object) {
            throw new Error("AI did not return a valid application object");
        }
        const application = result.object

        printSystem(chalk.green(`Generated Application: ${application.folderName}\n`));
        printSystem(chalk.gray(`Description: ${application.description}\n`));

        if (application.files.length === 0) {
            throw new Error("No files generated");
        }

        displayFileTree(application.files, application.folderName);

        printSystem(chalk.cyan(`\nCreate files.....`));

        const appDir = await createApplicationFiles(cwd, application.folderName, application.files);

        printSystem(chalk.green(`Application created successfully!\n`));
        printSystem(chalk.white(`Location: ${chalk.bold(appDir)}\n`));

        if (application.setUpCommand.length > 0) {
            printSystem(chalk.cyan(`\nNext Steps:\n`));
            printSystem(chalk.white('```bash'));

            application.setUpCommand.forEach(cmd => {
                printSystem(chalk.white(`- ${cmd}\n`));
            });

            printSystem(chalk.white('```\n'));
        }

        return {
            folderName: application.folderName,
            appDir,
            files: application.files.map(file => file.path),
            Command: application.setUpCommand,
            success: true
        }
    } catch (error) {
        printSystem(chalk.red(`Error generating application: ${error.message}`));
        if (error.stack) {
            printSystem(chalk.dim(error.stack + '\n'));
        }
        throw error;
    }
}