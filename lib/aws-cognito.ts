import {
  AdminCreateUserCommand,
  AdminInitiateAuthCommand,
  AdminGetUserCommand,
  ListUsersCommand,
  AdminDeleteUserCommand,
  AdminUpdateUserAttributesCommand,
  UserType,
  AttributeType,
  AdminGetUserCommandOutput,
} from "@aws-sdk/client-cognito-identity-provider";
import { cognitoClient, AWS_CONFIG } from "./aws-config";

export interface CognitoUser {
  id: string;
  email: string;
  name?: string;
  emailVerified: boolean;
  enabled: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  name?: string;
  temporaryPassword?: string;
  sendWelcomeEmail?: boolean;
}

export interface AuthenticateRequest {
  email: string;
  password: string;
}

export interface AuthenticationResult {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
  tokenType: string;
}

export class CognitoAuthService {
  private userPoolId: string;
  private clientId: string;

  constructor() {
    this.userPoolId = AWS_CONFIG.cognito.userPoolId!;
    this.clientId = AWS_CONFIG.cognito.clientId!;
  }

  async createUser(request: CreateUserRequest): Promise<CognitoUser> {
    const command = new AdminCreateUserCommand({
      UserPoolId: this.userPoolId,
      Username: request.email,
      UserAttributes: [
        { Name: "email", Value: request.email },
        { Name: "email_verified", Value: "true" },
        ...(request.name ? [{ Name: "name", Value: request.name }] : []),
      ],
      TemporaryPassword: request.temporaryPassword,
      MessageAction: request.sendWelcomeEmail ? "RESEND" : "SUPPRESS",
    });

    try {
      const result = await cognitoClient.send(command);

      if (!result.User) {
        throw new Error("Failed to create user");
      }

      return this.mapCognitoUserToUser(result.User);
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async getUser(email: string): Promise<CognitoUser | null> {
    const command = new AdminGetUserCommand({
      UserPoolId: this.userPoolId,
      Username: email,
    });

    try {
      const result = await cognitoClient.send(command);
      if (!result.Username) {
        throw new Error("User not found");
      }
      return this.mapCognitoUserDataToUser(result);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "UserNotFoundException") {
        return null;
      }
      console.error("Error getting user:", error);
      throw error;
    }
  }

  async authenticate(
    request: AuthenticateRequest
  ): Promise<AuthenticationResult> {
    const command = new AdminInitiateAuthCommand({
      UserPoolId: this.userPoolId,
      ClientId: this.clientId,
      AuthFlow: "ADMIN_NO_SRP_AUTH",
      AuthParameters: {
        USERNAME: request.email,
        PASSWORD: request.password,
      },
    });

    try {
      const result = await cognitoClient.send(command);

      if (!result.AuthenticationResult) {
        throw new Error("Authentication failed");
      }

      return {
        accessToken: result.AuthenticationResult.AccessToken!,
        refreshToken: result.AuthenticationResult.RefreshToken!,
        idToken: result.AuthenticationResult.IdToken!,
        expiresIn: result.AuthenticationResult.ExpiresIn!,
        tokenType: result.AuthenticationResult.TokenType!,
      };
    } catch (error) {
      console.error("Error authenticating user:", error);
      throw error;
    }
  }

  async listUsers(
    limit = 20,
    paginationToken?: string
  ): Promise<{ users: CognitoUser[]; nextToken?: string }> {
    const command = new ListUsersCommand({
      UserPoolId: this.userPoolId,
      Limit: limit,
      PaginationToken: paginationToken,
    });

    try {
      const result = await cognitoClient.send(command);
      const users = (result.Users || []).map((user) =>
        this.mapCognitoUserToUser(user)
      );

      return {
        users,
        nextToken: result.PaginationToken,
      };
    } catch (error) {
      console.error("Error listing users:", error);
      throw error;
    }
  }

  async deleteUser(email: string): Promise<void> {
    const command = new AdminDeleteUserCommand({
      UserPoolId: this.userPoolId,
      Username: email,
    });

    try {
      await cognitoClient.send(command);
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  async updateUserAttributes(
    email: string,
    attributes: Record<string, string>
  ): Promise<void> {
    const command = new AdminUpdateUserAttributesCommand({
      UserPoolId: this.userPoolId,
      Username: email,
      UserAttributes: Object.entries(attributes).map(([name, value]) => ({
        Name: name,
        Value: value,
      })),
    });

    try {
      await cognitoClient.send(command);
    } catch (error) {
      console.error("Error updating user attributes:", error);
      throw error;
    }
  }

  private mapCognitoUserToUser(cognitoUser: UserType): CognitoUser {
    const attributes = cognitoUser.Attributes || [];
    const getAttributeValue = (name: string) =>
      attributes.find((attr: AttributeType) => attr.Name === name)?.Value;

    return {
      id: cognitoUser.Username!,
      email: getAttributeValue("email") || cognitoUser.Username!,
      name: getAttributeValue("name"),
      emailVerified: getAttributeValue("email_verified") === "true",
      enabled: cognitoUser.Enabled || false,
      status: cognitoUser.UserStatus || "UNKNOWN",
      createdAt: new Date(cognitoUser.UserCreateDate!),
      updatedAt: new Date(cognitoUser.UserLastModifiedDate!),
    };
  }

  private mapCognitoUserDataToUser(
    userData: AdminGetUserCommandOutput
  ): CognitoUser {
    const getAttributeValue = (name: string) =>
      userData.UserAttributes?.find((attr: AttributeType) => attr.Name === name)
        ?.Value;

    return {
      id: userData.Username!,
      email: getAttributeValue("email") || userData.Username!,
      name: getAttributeValue("name"),
      emailVerified: getAttributeValue("email_verified") === "true",
      enabled: userData.Enabled || false,
      status: userData.UserStatus || "UNKNOWN",
      createdAt: new Date(userData.UserCreateDate!),
      updatedAt: new Date(userData.UserLastModifiedDate!),
    };
  }
}

export const cognitoAuth = new CognitoAuthService();
