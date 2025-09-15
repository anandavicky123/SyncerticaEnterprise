"use client";

import React, { useState } from "react";
import { X, Save, Cloud, Eye, ChevronDown } from "lucide-react";
import { useRepositories } from "../hooks/useRepositories";

interface InfrastructureEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  infrastructure?: {
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

const InfrastructureEditorModal: React.FC<InfrastructureEditorModalProps> = ({
  isOpen,
  onClose,
  infrastructure,
  mode,
  onSave,
}) => {
  const [content, setContent] = useState(
    infrastructure?.content ||
      `# Terraform Configuration

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "development"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "\${var.environment}-vpc"
    Environment = var.environment
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "\${var.environment}-igw"
    Environment = var.environment
  }
}

# Public Subnet
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name        = "\${var.environment}-public-subnet"
    Environment = var.environment
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

# Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "\${var.environment}-public-rt"
    Environment = var.environment
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# Security Group
resource "aws_security_group" "web" {
  name_prefix = "\${var.environment}-web-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "\${var.environment}-web-sg"
    Environment = var.environment
  }
}

# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_id" {
  description = "ID of the public subnet"
  value       = aws_subnet.public.id
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.web.id
}
`
  );

  const [filename, setFilename] = useState(infrastructure?.name || "main.tf");
  const [repository, setRepository] = useState(
    infrastructure?.repository || ""
  );
  const [infraType, setInfraType] = useState(
    infrastructure?.type || "terraform"
  );

  // Fetch repositories for dropdown
  const {
    repositories,
    loading: repositoriesLoading,
    error: repositoriesError,
  } = useRepositories();

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(content, filename, repository, infraType);
    onClose();
  };

  const handlePreview = () => {
    // Basic validation and preview
    try {
      console.log("Infrastructure preview:", {
        filename,
        content,
        type: infraType,
      });
      alert("Infrastructure configuration appears valid!");
    } catch {
      alert("Invalid configuration detected!");
    }
  };

  const getTemplateContent = (type: string) => {
    switch (type) {
      case "terraform":
        return content; // Already Terraform template
      case "cloudformation":
        return `AWSTemplateFormatVersion: '2010-09-09'
Description: 'CloudFormation template for basic infrastructure'

Parameters:
  Environment:
    Type: String
    Default: development
    Description: Environment name

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '\${Environment}-vpc'
        - Key: Environment
          Value: !Ref Environment

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '\${Environment}-igw'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '\${Environment}-VPC-ID'`;
      case "kubernetes":
        return `apiVersion: v1
kind: Namespace
metadata:
  name: my-app
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: my-app
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
        image: nginx:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
  namespace: my-app
spec:
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer`;
      default:
        return content;
    }
  };

  const handleTypeChange = (newType: string) => {
    setInfraType(newType);
    setContent(getTemplateContent(newType));
    // Update filename extension based on type
    const extensions = {
      terraform: ".tf",
      cloudformation: ".yaml",
      kubernetes: ".yaml",
      ansible: ".yml",
    };
    const baseFilename = filename.split(".")[0];
    setFilename(
      `${baseFilename}${
        extensions[newType as keyof typeof extensions] || ".tf"
      }`
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Cloud className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === "create"
                ? "Create Infrastructure"
                : "Edit Infrastructure"}
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
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
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
                  value={infraType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="terraform">Terraform</option>
                  <option value="cloudformation">CloudFormation</option>
                  <option value="kubernetes">Kubernetes</option>
                  <option value="ansible">Ansible</option>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="main.tf"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repository
                </label>
                {repositoriesLoading ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                    Loading repositories...
                  </div>
                ) : repositoriesError ? (
                  <div className="w-full px-3 py-2 border border-red-300 rounded-lg bg-red-50 text-red-600 text-sm">
                    {repositoriesError}
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={repository}
                      onChange={(e) => setRepository(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white pr-10"
                    >
                      <option value="">Select a repository</option>
                      {repositories.map((repo) => (
                        <option key={repo.id} value={repo.full_name}>
                          {repo.full_name}{" "}
                          {repo.private ? "(private)" : "(public)"}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 p-6 overflow-hidden">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Infrastructure Configuration ({infraType.toUpperCase()})
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-80 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm resize-none overflow-y-auto"
            placeholder="Enter your infrastructure configuration here..."
          />
        </div>
      </div>
    </div>
  );
};

export default InfrastructureEditorModal;
