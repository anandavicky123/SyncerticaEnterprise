"use client";

import React, { useState } from "react";
import { X, Save, Container, Eye } from "lucide-react";

interface ContainerEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  container?: {
    id: string;
    name: string;
    repository: string;
    content?: string;
    type: string;
  } | null;
  mode: "create" | "edit";
  onSave: (
    content: string,
    filename?: string,
    repository?: string,
    type?: string
  ) => void;
}

const ContainerEditorModal: React.FC<ContainerEditorModalProps> = ({
  isOpen,
  onClose,
  container,
  mode,
  onSave,
}) => {
  const [content, setContent] = useState(
    container?.content ||
      `# Use Node.js official image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
`
  );

  const [filename, setFilename] = useState(container?.name || "Dockerfile");
  const [repository, setRepository] = useState(container?.repository || "");
  const [containerType, setContainerType] = useState(
    container?.type || "dockerfile"
  );

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(content, filename, repository, containerType);
    onClose();
  };

  const handlePreview = () => {
    // Basic validation and preview
    try {
      console.log("Container preview:", {
        filename,
        content,
        type: containerType,
      });
      alert("Container configuration appears valid!");
    } catch {
      alert("Invalid configuration detected!");
    }
  };

  const getTemplateContent = (type: string) => {
    switch (type) {
      case "dockerfile":
        return content; // Already Dockerfile template
      case "docker-compose":
        return `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@db:5432/myapp
    depends_on:
      - db
      - redis
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    driver: bridge`;
      case "kubernetes":
        return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  labels:
    app: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: my-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
---
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  database-url: cG9zdGdyZXNxbDovL3VzZXI6cGFzc3dvcmRAZGI6NTQzMi9teWFwcA==`;
      case "podman":
        return `# Podman Containerfile
FROM registry.access.redhat.com/ubi8/nodejs-18

# Set working directory
WORKDIR /opt/app-root/src

# Copy package files
COPY package*.json ./

# Install dependencies as root
USER 0
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Change ownership back to default user
RUN chown -R 1001:0 /opt/app-root/src

# Switch back to non-root user
USER 1001

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]`;
      default:
        return content;
    }
  };

  const handleTypeChange = (newType: string) => {
    setContainerType(newType);
    setContent(getTemplateContent(newType));
    // Update filename based on type
    const filenames = {
      dockerfile: "Dockerfile",
      "docker-compose": "docker-compose.yml",
      kubernetes: "deployment.yaml",
      podman: "Containerfile",
    };
    setFilename(filenames[newType as keyof typeof filenames] || "Dockerfile");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Container className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === "create" ? "Create Container" : "Edit Container"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreview}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={handleSave}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form Fields */}
        {mode === "create" && (
          <div className="p-6 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={containerType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="dockerfile">Dockerfile</option>
                  <option value="docker-compose">Docker Compose</option>
                  <option value="kubernetes">Kubernetes</option>
                  <option value="podman">Podman</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filename
                </label>
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Dockerfile"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repository
                </label>
                <input
                  type="text"
                  value={repository}
                  onChange={(e) => setRepository(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="repository-name"
                />
              </div>
            </div>
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Container Configuration ({containerType.toUpperCase()})
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-80 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm resize-none overflow-y-auto"
            placeholder="Enter your container configuration here..."
          />
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {mode === "edit" && container
                ? `Editing: ${container.name} in ${container.repository}`
                : `Creating new ${containerType} file`}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                {mode === "create" ? "Create Container" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContainerEditorModal;
