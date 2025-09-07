export interface Worker {
  id: string;
  managerDeviceUUID: string;
  name: string;
  pronouns: string | null;
  jobRole: "UI/UX Designer" | "Developer" | "Manager" | "QA";
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkersManagementProps {
  className?: string;
}
