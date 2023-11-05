'use strict';

const fs = require('fs');
const uuid = require('uuid');
const dayjs = require('dayjs');

const OPENRXV_FINAL_INDEX = 'openrxv-items-final';
const OPENRXV_TEMP_INDEX = 'openrxv-items-temp';
const OPENRXV_ALIAS = 'openrxv-items';
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
            created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            to_be_indexed: true
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
    MigrateElasticsearchIndexes: (indexType, newIndexName, newIndexAlias, oldIndexName) => {
        console.log(`${styles.yellow}${styles.bold}Delete the new index if exists${styles.default}`);
        console.log(`> curl -X DELETE elasticsearch:9200/${newIndexName}?ignore_unavailable=true`);

        console.log(`${styles.yellow}${styles.bold}Create the new index${styles.default}`);
        console.log(`> curl -X PUT elasticsearch:9200/${newIndexName}`);

        console.log(`${styles.yellow}${styles.bold}Move data to the new index${styles.default}`);
        console.log(`> curl -X POST elasticsearch:9200/_reindex?wait_for_completion=true -H "Content-Type:application/json" -d '{
                "conflicts": "proceed",
                "source": {
                    "index": "${oldIndexName}"
                },
                "dest": {
                    "index": "${newIndexName}"
                }
            }'`);

        if (indexType === 'main') {
            console.log(`${styles.yellow}${styles.bold}Remove old aliases and create new one${styles.default}`);
            console.log(`> curl -X POST elasticsearch:9200/_aliases -H "Content-Type:application/json" -d '{
                "actions": [
                    {
                        "remove": {
                            "index": "${oldIndexName}",
                            "alias": "${OPENRXV_ALIAS}"
                        }
                    },
                    {
                        "remove": {
                            "index": "${OPENRXV_TEMP_INDEX}",
                            "alias": "${OPENRXV_ALIAS}"
                        }
                    },
                    {
                        "add": {
                            "index": "${newIndexName}",
                            "alias": "${newIndexAlias}"
                        }
                    }
                ]
            }'`);
        }

        console.log(`${styles.yellow}${styles.bold}Delete old index${styles.default}`);
        console.log(`> curl -X DELETE elasticsearch:9200/${oldIndexName}?ignore_unavailable=true`);

        if (indexType === 'main') {
            console.log(`${styles.yellow}${styles.bold}Delete old temp index${styles.default}`);
            console.log(`> curl -X DELETE elasticsearch:9200/${OPENRXV_TEMP_INDEX}?ignore_unavailable=true`);
        }
    }
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
        console.log(`${styles.bold}${styles.red}Fix issues first${styles.default}`);
    } else {
        await operations.MigrateIndexes();
        await operations.MigrateDashboard();
        await operations.MigratePlugins();
        await operations.MigrateData();
        await operations.MigrateDataToUse();

        console.log(`${styles.bold}Migrated index name: ${styles.green}${operations.activeIndex.name}${styles.default}`);

        console.log(`${styles.bold}####################################${styles.default}`);
        console.log(`${styles.bold}##                                ##${styles.default}`);
        console.log(`${styles.bold}## ${styles.yellow}Migrating the main items index${styles.default}${styles.bold} ##${styles.default}`);
        console.log(`${styles.bold}##                                ##${styles.default}`);
        console.log(`${styles.bold}####################################${styles.default}`);
        operations.MigrateElasticsearchIndexes('main', operations.activeIndex.name, `${operations.activeIndex.name}_final`, OPENRXV_FINAL_INDEX);

        console.log(`${styles.bold}####################################${styles.default}`);
        console.log(`${styles.bold}##                                ##${styles.default}`);
        console.log(`${styles.bold}## ${styles.yellow}  Migrating the values index  ${styles.default}${styles.bold} ##${styles.default}`);
        console.log(`${styles.bold}##                                ##${styles.default}`);
        console.log(`${styles.bold}####################################${styles.default}`);
        operations.MigrateElasticsearchIndexes('values', `${operations.activeIndex.name}-values`, null, 'openrxv-values');

        console.log(`${styles.bold}####################################${styles.default}`);
        console.log(`${styles.bold}##                                ##${styles.default}`);
        console.log(`${styles.bold}## ${styles.yellow}  Migrating the shared index  ${styles.default}${styles.bold} ##${styles.default}`);
        console.log(`${styles.bold}##                                ##${styles.default}`);
        console.log(`${styles.bold}####################################${styles.default}`);
        operations.MigrateElasticsearchIndexes('values', `${operations.activeIndex.name}-shared`, null, 'openrxv-shared');
    }
})();

const styles = {
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    bold: '\x1b[1m',
    default: '\x1b[0m'
}
