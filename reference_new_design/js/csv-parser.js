/**
 * CSV DATA PARSER
 * Parses CSV files and creates structured data for Water sector
 */

const CSVParser = {
    
    // Parse CSV text to array of objects
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = values[index];
                });
                data.push(obj);
            }
        }
        return data;
    },

    // Handle quoted fields in CSV
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    },

    // Load all CSV data
    async loadAllData() {
        try {
            const [objectives, performance, capabilities, policyTools] = await Promise.all([
                fetch('data/sec_objectives_rows.csv').then(r => r.text()),
                fetch('data/sec_performance_rows.csv').then(r => r.text()),
                fetch('data/ent_capabilities_rows.csv').then(r => r.text()),
                fetch('data/sec_policy_tools_rows.csv').then(r => r.text())
            ]);

            return {
                objectives: this.parseCSV(objectives),
                performance: this.parseCSV(performance),
                capabilities: this.parseCSV(capabilities),
                policyTools: this.parseCSV(policyTools)
            };
        } catch (error) {
            console.error('Error loading CSV data:', error);
            return null;
        }
    },

    // Filter by year and level
    filterByYearAndLevel(data, year = '2025', level = null) {
        let filtered = data.filter(item => item.year === year);
        if (level) {
            filtered = filtered.filter(item => item.level === level);
        }
        return filtered;
    },

    // Build hierarchy (L1 -> L2 -> L3)
    buildHierarchy(data, year = '2025') {
        const l1Items = this.filterByYearAndLevel(data, year, 'L1');
        
        return l1Items.map(l1 => {
            const l2Items = data.filter(item => 
                item.year === year && 
                item.level === 'L2' && 
                item.parent_id === l1.id
            );

            const l2WithL3 = l2Items.map(l2 => {
                const l3Items = data.filter(item =>
                    item.year === year &&
                    item.level === 'L3' &&
                    item.parent_id === l2.id
                );

                return {
                    ...l2,
                    l3: l3Items
                };
            });

            return {
                ...l1,
                l2: l2WithL3
            };
        });
    },

    // Get capabilities in matrix format for Engine Room
    getCapabilityMatrix(capabilities, year = '2025') {
        const hierarchy = this.buildHierarchy(capabilities, year);
        
        // Calculate max L2 and L3 counts for layout
        let maxL2 = 0;
        let maxL3 = 0;
        
        hierarchy.forEach(l1 => {
            if (l1.l2.length > maxL2) maxL2 = l1.l2.length;
            l1.l2.forEach(l2 => {
                if (l2.l3.length > maxL3) maxL3 = l2.l3.length;
            });
        });

        return {
            data: hierarchy,
            maxL2,
            maxL3
        };
    }
};

// Make available globally
window.CSVParser = CSVParser;
