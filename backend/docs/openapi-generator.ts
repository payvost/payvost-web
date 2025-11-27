/**
 * OpenAPI/Swagger Documentation Generator
 * Generates API documentation from route definitions
 */

import { Router } from 'express';

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  summary: string;
  description?: string;
  tags?: string[];
  requestBody?: any;
  parameters?: Array<{
    name: string;
    in: 'query' | 'path' | 'header';
    required: boolean;
    schema: any;
    description?: string;
  }>;
  responses: Record<string, {
    description: string;
    content?: any;
  }>;
  security?: Array<{ bearerAuth: [] }>;
}

export interface ApiSpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
    contact?: {
      name: string;
      email: string;
      url: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, any>;
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http';
        scheme: 'bearer';
        bearerFormat: 'JWT';
      };
    };
    schemas: Record<string, any>;
  };
}

/**
 * Generate OpenAPI specification
 */
export function generateOpenAPISpec(endpoints: ApiEndpoint[]): ApiSpec {
  const paths: Record<string, any> = {};

  endpoints.forEach(endpoint => {
    const pathKey = endpoint.path;
    if (!paths[pathKey]) {
      paths[pathKey] = {};
    }

    const operation: any = {
      summary: endpoint.summary,
      description: endpoint.description,
      tags: endpoint.tags || [],
      responses: endpoint.responses,
    };

    if (endpoint.parameters && endpoint.parameters.length > 0) {
      operation.parameters = endpoint.parameters.map(param => ({
        name: param.name,
        in: param.in,
        required: param.required,
        schema: param.schema,
        description: param.description,
      }));
    }

    if (endpoint.requestBody) {
      operation.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: endpoint.requestBody,
          },
        },
      };
    }

    if (endpoint.security) {
      operation.security = endpoint.security;
    }

    paths[pathKey][endpoint.method.toLowerCase()] = operation;
  });

  return {
    openapi: '3.0.0',
    info: {
      title: 'Payvost API',
      version: '1.0.0',
      description: 'Payvost Cross-Border Payment Platform API',
      contact: {
        name: 'Payvost API Support',
        email: 'api@payvost.com',
        url: 'https://docs.payvost.com',
      },
    },
    servers: [
      {
        url: 'https://api.payvost.com/api/v1',
        description: 'Production',
      },
      {
        url: 'https://sandbox-api.payvost.com/api/v1',
        description: 'Sandbox',
      },
    ],
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        Transfer: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            fromAccountId: { type: 'string', format: 'uuid' },
            toAccountId: { type: 'string', format: 'uuid' },
            amount: { type: 'number' },
            currency: { type: 'string', example: 'USD' },
            status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'FAILED'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  };
}

/**
 * Register OpenAPI documentation endpoint
 */
export function registerOpenAPIDocs(app: Router, spec: ApiSpec): void {
  // JSON endpoint
  app.get('/docs/openapi.json', (req, res) => {
    res.json(spec);
  });

  // Swagger UI endpoint (requires swagger-ui-express)
  // app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
}

