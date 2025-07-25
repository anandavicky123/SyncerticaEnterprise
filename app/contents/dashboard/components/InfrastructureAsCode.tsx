"use client";

import React, { useState } from "react";
import {
  Cloud,
  Server,
  Database,
  Shield,
  Network,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Download,
  Eye,
  Package,
  Activity,
  AlertTriangle,
  Settings,
  Code2,
} from "lucide-react";

interface CloudFormationStack {
  id: string;
  name: string;
  status:
    | "CREATE_COMPLETE"
    | "UPDATE_COMPLETE"
    | "ROLLBACK_COMPLETE"
    | "CREATE_IN_PROGRESS"
    | "DELETE_IN_PROGRESS"
    | "FAILED";
  template: string;
  region: string;
  resources: number;
  lastUpdated: string;
  driftStatus: "DRIFTED" | "IN_SYNC" | "NOT_CHECKED";
  cost: number;
}

interface InfrastructureAsCodeProps {
  className?: string;
}

const InfrastructureAsCode: React.FC<InfrastructureAsCodeProps> = ({
  className = "",
}) => {
  const [stacks] = useState<CloudFormationStack[]>([
    {
      id: "stack-1",
      name: "syncertica-vpc-network",
      status: "CREATE_COMPLETE",
      template: "vpc-template.yaml",
      region: "us-east-1",
      resources: 15,
      lastUpdated: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      driftStatus: "IN_SYNC",
      cost: 45.67,
    },
    {
      id: "stack-2",
      name: "syncertica-ecs-cluster",
      status: "UPDATE_COMPLETE",
      template: "ecs-cluster.yaml",
      region: "us-east-1",
      resources: 8,
      lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      driftStatus: "IN_SYNC",
      cost: 127.89,
    },
    {
      id: "stack-3",
      name: "syncertica-database",
      status: "CREATE_COMPLETE",
      template: "rds-database.yaml",
      region: "us-east-1",
      resources: 6,
      lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      driftStatus: "DRIFTED",
      cost: 89.45,
    },
    {
      id: "stack-4",
      name: "syncertica-lambda-functions",
      status: "CREATE_IN_PROGRESS",
      template: "lambda-functions.yaml",
      region: "us-east-1",
      resources: 12,
      lastUpdated: new Date().toISOString(),
      driftStatus: "NOT_CHECKED",
      cost: 23.12,
    },
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "stacks" | "templates" | "terraform" | "monitoring"
  >("stacks");

  const cloudFormationTemplates = {
    "vpc-template.yaml": `AWSTemplateFormatVersion: '2010-09-09'
Description: 'VPC Network Infrastructure for Syncertica Enterprise'

Parameters:
  Environment:
    Type: String
    Default: production
    AllowedValues: [development, staging, production]

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'syncertica-vpc-\${Environment}'
        - Key: Environment
          Value: !Ref Environment

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'syncertica-public-subnet-1-\${Environment}'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'syncertica-public-subnet-2-\${Environment}'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'syncertica-igw-\${Environment}'

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub 'syncertica-vpc-id-\${Environment}'

  PublicSubnet1Id:
    Description: Public Subnet 1 ID
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub 'syncertica-public-subnet-1-id-\${Environment}'

  PublicSubnet2Id:
    Description: Public Subnet 2 ID
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub 'syncertica-public-subnet-2-id-\${Environment}'`,

    "ecs-cluster.yaml": `AWSTemplateFormatVersion: '2010-09-09'
Description: 'ECS Cluster for Syncertica Enterprise Application'

Parameters:
  VPCId:
    Type: String
    Description: VPC ID from network stack
  
  PublicSubnet1Id:
    Type: String
    Description: Public Subnet 1 ID
  
  PublicSubnet2Id:
    Type: String
    Description: Public Subnet 2 ID

Resources:
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: syncertica-cluster
      CapacityProviders:
        - FARGATE
        - FARGATE_SPOT
      DefaultCapacityProviderStrategy:
        - CapacityProvider: FARGATE
          Weight: 1
        - CapacityProvider: FARGATE_SPOT
          Weight: 4

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: syncertica-alb
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnet1Id
        - !Ref PublicSubnet2Id
      SecurityGroups:
        - !Ref ALBSecurityGroup

  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPCId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0

Outputs:
  ECSClusterArn:
    Description: ECS Cluster ARN
    Value: !GetAtt ECSCluster.Arn
    Export:
      Name: syncertica-ecs-cluster-arn

  LoadBalancerDNS:
    Description: Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: syncertica-alb-dns`,
  };

  const terraformConfig = `# Syncertica Enterprise Infrastructure
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "syncertica-terraform-state"
    key    = "infrastructure/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "SyncerticaEnterprise"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"
  
  environment = var.environment
  cidr_block  = "10.0.0.0/16"
  
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnets = ["10.0.10.0/24", "10.0.20.0/24"]
  
  enable_nat_gateway = true
  enable_vpn_gateway = false
}

# ECS Module
module "ecs" {
  source = "./modules/ecs"
  
  environment    = var.environment
  vpc_id         = module.vpc.vpc_id
  public_subnets = module.vpc.public_subnet_ids
  
  cluster_name = "syncertica-cluster"
  
  depends_on = [module.vpc]
}

# RDS Module
module "database" {
  source = "./modules/rds"
  
  environment     = var.environment
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnet_ids
  
  engine_version    = "14.9"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  
  depends_on = [module.vpc]
}

# Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "ecs_cluster_arn" {
  description = "ECS Cluster ARN"
  value       = module.ecs.cluster_arn
}

output "database_endpoint" {
  description = "RDS Database endpoint"
  value       = module.database.endpoint
  sensitive   = true
}`;

  const getStatusIcon = (status: CloudFormationStack["status"]) => {
    switch (status) {
      case "CREATE_COMPLETE":
      case "UPDATE_COMPLETE":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "FAILED":
      case "ROLLBACK_COMPLETE":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "CREATE_IN_PROGRESS":
      case "DELETE_IN_PROGRESS":
        return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: CloudFormationStack["status"]) => {
    switch (status) {
      case "CREATE_COMPLETE":
      case "UPDATE_COMPLETE":
        return "bg-green-50 border-green-200 text-green-800";
      case "FAILED":
      case "ROLLBACK_COMPLETE":
        return "bg-red-50 border-red-200 text-red-800";
      case "CREATE_IN_PROGRESS":
      case "DELETE_IN_PROGRESS":
        return "bg-blue-50 border-blue-200 text-blue-800";
      default:
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
    }
  };

  const getDriftStatusColor = (status: CloudFormationStack["driftStatus"]) => {
    switch (status) {
      case "IN_SYNC":
        return "text-green-600";
      case "DRIFTED":
        return "text-red-600";
      case "NOT_CHECKED":
        return "text-gray-500";
      default:
        return "text-gray-500";
    }
  };

  const getTotalCost = () => {
    return stacks.reduce((total, stack) => total + stack.cost, 0).toFixed(2);
  };

  const tabs = [
    { id: "stacks", label: "CloudFormation Stacks", icon: Cloud },
    { id: "templates", label: "Templates", icon: FileText },
    { id: "terraform", label: "Terraform", icon: Code2 },
    { id: "monitoring", label: "Monitoring", icon: Activity },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Infrastructure as Code
          </h2>
          <p className="text-gray-600">
            AWS CloudFormation, Terraform & Resource Management
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Monthly Cost:{" "}
            <span className="font-bold text-blue-600">${getTotalCost()}</span>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Play className="w-4 h-4" />
            Deploy Stack
          </button>
        </div>
      </div>

      {/* AWS Services Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Cloud className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">CloudFormation</h3>
              <p className="text-sm text-green-600">
                {stacks.filter((s) => s.status.includes("COMPLETE")).length}{" "}
                Active
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Server className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">EC2 Instances</h3>
              <p className="text-sm text-green-600">3 Running</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">RDS Databases</h3>
              <p className="text-sm text-green-600">1 Available</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Network className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">VPC Networks</h3>
              <p className="text-sm text-green-600">1 Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(
                    tab.id as
                      | "stacks"
                      | "templates"
                      | "terraform"
                      | "monitoring"
                  )
                }
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* CloudFormation Stacks Tab */}
      {activeTab === "stacks" && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              CloudFormation Stacks
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {stacks.map((stack) => (
              <div
                key={stack.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(stack.status)}
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {stack.name}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span>{stack.template}</span>
                        <span>{stack.region}</span>
                        <span>{stack.resources} resources</span>
                        <span>
                          Updated {new Date(stack.lastUpdated).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                        stack.status
                      )}`}
                    >
                      {stack.status.replace(/_/g, " ")}
                    </div>
                    <div
                      className={`text-sm font-medium ${getDriftStatusColor(
                        stack.driftStatus
                      )}`}
                    >
                      {stack.driftStatus === "IN_SYNC"
                        ? "✓ In Sync"
                        : stack.driftStatus === "DRIFTED"
                        ? "⚠ Drifted"
                        : "? Not Checked"}
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      ${stack.cost}
                    </span>
                    <div className="flex gap-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(cloudFormationTemplates).map(
              ([filename, content]) => (
                <div
                  key={filename}
                  className="bg-white rounded-lg border border-gray-200"
                >
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{filename}</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setSelectedTemplate(
                              selectedTemplate === filename ? null : filename
                            )
                          }
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-sm text-gray-600 mb-2">
                      CloudFormation Template • YAML Format
                    </div>
                    {selectedTemplate === filename ? (
                      <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto max-h-96 overflow-y-auto">
                        {content}
                      </pre>
                    ) : (
                      <div className="text-sm text-gray-500">
                        Click to view template content...
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Terraform Tab */}
      {activeTab === "terraform" && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Terraform Configuration
              </h3>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium">
                  terraform plan
                </button>
                <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
                  terraform apply
                </button>
              </div>
            </div>
          </div>
          <div className="p-6">
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto max-h-96 overflow-y-auto">
              {terraformConfig}
            </pre>
          </div>
        </div>
      )}

      {/* Monitoring Tab */}
      {activeTab === "monitoring" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900">Resource Health</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Healthy Resources
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    41/45
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Warning</span>
                  <span className="text-sm font-medium text-yellow-600">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Critical</span>
                  <span className="text-sm font-medium text-red-600">1</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-medium text-gray-900">Compliance</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Config Rules</span>
                  <span className="text-sm font-medium text-green-600">
                    98% Compliant
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Security Groups</span>
                  <span className="text-sm font-medium text-green-600">
                    All Secured
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">IAM Policies</span>
                  <span className="text-sm font-medium text-yellow-600">
                    2 Warnings
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-medium text-gray-900">Cost Optimization</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Monthly Spend</span>
                  <span className="text-sm font-medium text-blue-600">
                    ${getTotalCost()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Savings Opportunity
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    $23.45
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Utilization</span>
                  <span className="text-sm font-medium text-blue-600">78%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Infrastructure Changes */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Infrastructure Changes
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {[
                {
                  action: "Stack Update",
                  resource: "syncertica-ecs-cluster",
                  time: "2 hours ago",
                  status: "success",
                },
                {
                  action: "Resource Created",
                  resource: "Lambda Function: auth-handler",
                  time: "4 hours ago",
                  status: "success",
                },
                {
                  action: "Drift Detection",
                  resource: "syncertica-database",
                  time: "6 hours ago",
                  status: "warning",
                },
                {
                  action: "Security Scan",
                  resource: "All Resources",
                  time: "12 hours ago",
                  status: "success",
                },
              ].map((change, index) => (
                <div
                  key={index}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {change.status === "success" ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {change.action}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {change.resource}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{change.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfrastructureAsCode;
