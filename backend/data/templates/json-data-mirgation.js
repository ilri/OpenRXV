'use strict';

const fs = require('fs');
const uuid = require('uuid');
import * as dayjs from 'dayjs';

const files = {
    old: {
        appearance: {},
        data: {},
        dataToUse: {},
        explorer: {},
        plugins: [],
        reports: []
    },
    templates: {
        dashboards: [],
        data: {},
        dataToUse: {},
        indexes: [],
        plugins: {},
    },
};
let hasErrors = false;

const operations = {
    activeIndex: null,
    IsValidName: (name, compareToArray, compareToKey) => {
        // Replace non-word character with -
        name = name.replace(/\W|_/g, '-');
        // Remove duplicated -
        name = name.replace(/-{2,}/g, '-');
        // Remove trailing -
        name = name.replace(/^-|-$/g, '-');
        name = name.length > 0 ? name.toLowerCase() : 'auto-generated';

        let tempName = name;
        while (compareToArray.filter(index => index.hasOwnProperty(compareToKey) && index[compareToKey] === tempName).length > 0) {
            tempName = name + '-' + Math.random().toString(36).substring(2, 7);
        }
        return tempName;
    },
    loadFile: async (path, file) => {
        try {
            return await require(`${path}${file}.json`);
        } catch (e) {
            hasErrors = true;
            console.log(`Failed to load ${path}${file}.json with error => `, e);
            return null;
        }
    },
    writeFile: async (file, data) => {
        try {
            await fs.mkdirSync(`${__dirname}/migrated`);
        } catch (e) {
        }
        await fs.writeFileSync(`${__dirname}/migrated/${file}.json`, JSON.stringify(data));
    },
    createNewIndex: (name, description) => {
        return {
            id: uuid.v4(),
            name: operations.IsValidName(name, files.templates.indexes, 'name'),
            description: description,
            created_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
        };
    },
    MigrateIndexes: async () => {
        operations.activeIndex = operations.createNewIndex(files?.old?.appearance?.website_name, 'Auto migrated index');
        files.templates.indexes.push(operations.activeIndex);
        await operations.writeFile('indexes', files.templates.indexes);
    },
    MigrateAppearance: () => {
        if (!files.old.appearance.hasOwnProperty('show_tool_bar')) {
            files.old.appearance.show_tool_bar = true;
        }
        if (!files.old.appearance.hasOwnProperty('show_side_nav')) {
            files.old.appearance.show_side_nav = true;
        }
        if (!files.old.appearance.hasOwnProperty('show_top_nav')) {
            files.old.appearance.show_top_nav = false;
        }
        if (!files.old.appearance.hasOwnProperty('secondary_color')) {
            files.old.appearance.secondary_color = null;
        }
    },
    CreateDashboard: (name, description, indexId, appearance, explorer, reports) => {
        return {
            id: uuid.v4(),
            index: indexId,
            name: operations.IsValidName(name, files.templates.dashboards, 'name'),
            appearance,
            explorer,
            reports,
            description,
            created_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
        }
    },
    MigrateDashboard: async () => {
        operations.MigrateAppearance();
        const dashboard = operations.CreateDashboard(
            files?.old?.appearance?.website_name,
            'Auto migrated dashboard',
            operations.activeIndex.id,
            files.old.appearance,
            files.old.explorer,
            files.old.reports,
        )
        files.templates.dashboards.push(dashboard);
        await operations.writeFile('dashboards', files.templates.dashboards);
    },
    MigratePlugins: async () => {
        files.old.plugins = files.old.plugins.filter(plugin => plugin.name !== 'dspace_add_missing_items');
        files.templates.plugins[operations.activeIndex.name] = files.old.plugins.map((plugin) => {
            if (plugin.name === 'dspace_health_check') {
                plugin.name = 'dspace_add_missing_items';
                plugin.value = plugin.value.map((value) => {
                    return value.sitemapIdentifier = {
                        "repo": value.repo,
                        "itemEndPoint": value.itemEndPoint,
                        "sitemapIdentifier": "handle"
                    };
                });
            }
            return plugin;
        });
        await operations.writeFile('plugins', files.templates.plugins);
    },
    MigrateData: async () => {
        files.templates.data[operations.activeIndex.name] = files.old.data;
        await operations.writeFile('data', files.templates.data);
    },
    MigrateDataToUse: async () => {
        files.templates.dataToUse[operations.activeIndex.name] = files.old.dataToUse;
        await operations.writeFile('dataToUse', files.templates.dataToUse);
    },
};

(async () => {
    for (const file in files.old) {
        if (files.old.hasOwnProperty(file)) {
            const json = await operations.loadFile(`${__dirname}/../`, file);
            if (json !== null) {
                files.old[file] = json;
            }
        }
    }
    for (const file in files.templates) {
        if (files.templates.hasOwnProperty(file)) {
            const json = await operations.loadFile(`${__dirname}/`, `example.${file}`);
            if (json !== null) {
                files.templates[file] = json;
            }
        }
    }

    if (hasErrors) {
        console.log('Fix issues first')
    } else {
        await operations.MigrateIndexes();
        await operations.MigrateDashboard();
        await operations.MigratePlugins();
        await operations.MigrateData();
        await operations.MigrateDataToUse();

        console.log(JSON.stringify(operations.activeIndex));
    }
})();

