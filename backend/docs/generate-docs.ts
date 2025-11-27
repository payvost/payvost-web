/**
 * Generate OpenAPI Documentation
 * Run this script to generate and save OpenAPI spec
 */

import { generateOpenAPISpec } from './openapi-generator';
import { apiEndpoints } from './api-endpoints';
import * as fs from 'fs';
import * as path from 'path';

const spec = generateOpenAPISpec(apiEndpoints);
const outputPath = path.join(__dirname, '../openapi.json');

fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
console.log(`✅ OpenAPI specification generated: ${outputPath}`);

