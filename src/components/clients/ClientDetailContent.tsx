"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  User,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  MessageSquare,
  Shield,
  Briefcase,
  MoreHorizontal,
  ExternalLink,
  Edit,
  AlertTriangle,
  XCircle,
  CircleDot,
} from "lucide-react";

// Types
interface ClientStats {
  openTasksCount: number;
  pendingDocsCount: number;
  receivedDocsCount: number;
  totalProjects: number;
  activeProjects: number;
}

interface UpcomingDeadline {
  id: string;
  title: string;
  dueDate: Date | null;
  status: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  createdAt: Date;
}

interface Project {
  id: string;
  name: string;
  status: string;
  dueDate: Date | null;
  createdAt: Date;
  completedAt: Date | null;
  tasks: Task[];
}

interface Document {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: Date;
  fileUrl: string | null;
}

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  isPrimary: boolean;
}

interface Client {
  id: string;
  clientType: string;
  legalName: string;
  preferredName: string | null;
  entityType: string | null;
  taxId: string | null;
  primaryEmail: string;
  primaryPhone: string | null;
  mailingStreet: string | null;
  mailingCity: string | null;
  mailingState: string | null;
  mailingZip: string | null;
  mailingCountry: string | null;
  status: string;
  servicesRequired: string[];
  primaryAccountManager: string | null;
  onboardingStatus: string;
  kycAmlStatus: string;
  governmentIdUploaded: boolean;
  businessDocsUploaded: boolean;
  engagementLetterSigned: boolean;
  riskRating: string | null;
  internalNotes: string | null;
  tags: string[];
  createdAt: Date;
  projects: Project[];
  documents: Document[];
  contacts: Contact[];
  stats: ClientStats;
  upcomingDeadlines: UpcomingDeadline[];
}

interface ClientDetailContentProps {
  client: Client;
}

// Helper functions
const formatDate = (date: Date | string | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-gray-100 text-gray-800",
    SUSPENDED: "bg-red-100 text-red-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    AT_RISK: "bg-orange-100 text-orange-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

const getTaskStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    TODO: "bg-gray-100 text-gray-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    IN_REVIEW: "bg-purple-100 text-purple-800",
    WAITING_ON_CLIENT: "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

const getServiceLabel = (service: string) => {
  const labels: Record<string, string> = {
    TAX_PREPARATION: "Tax Prep",
    BOOKKEEPING: "Bookkeeping",
    PAYROLL: "Payroll",
    AUDIT: "Audit",
    REVIEW: "Review",
    COMPILATION: "Compilation",
    ADVISORY: "Advisory",
    HST_SERVICES: "HST Services",
    TAX_REORGANIZATION: "Tax Reorg",
    OTHER: "Other",
  };
  return labels[service] || service;
};

const getRiskColor = (risk: string | null) => {
  if (!risk) return "bg-gray-100 text-gray-600";
  const colors: Record<string, string> = {
    LOW: "bg-green-100 text-green-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    HIGH: "bg-orange-100 text-orange-800",
    CRITICAL: "bg-red-100 text-red-800",
  };
  return colors[risk] || "bg-gray-100 text-gray-600";
};

const getKycStatusIcon = (status: string) => {
  switch (status) {
    case "VERIFIED":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "IN_PROGRESS":
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case "FAILED":
    case "EXPIRED":
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <CircleDot className="h-4 w-4 text-gray-400" />;
  }
};

export default function ClientDetailContent({ client }: ClientDetailContentProps) {
  const [activeTab, setActiveTab] = useState("overview");
  
  const displayName = client.preferredName || client.legalName;
  const allTasks = client.projects.flatMap((p) => p.tasks);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/clients">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Clients
              </Button>
            </Link>
          </div>
          
          {/* Top Summary Panel */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left: Client Info */}
            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  {client.clientType === "INDIVIDUAL" ? (
                    <User className="h-8 w-8 text-blue-600" />
                  ) : (
                    <Building2 className="h-8 w-8 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                      {client.status}
                    </span>
                    {client.riskRating && (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(client.riskRating)}`}>
                        {client.riskRating} Risk
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {client.clientType} {client.entityType && `• ${client.entityType.replace("_", " ")}`}
                  </p>
                  
                  {/* Quick Actions */}
                  <div className="flex items-center gap-3 mt-3">
                    <a href={`mailto:${client.primaryEmail}`} className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800">
                      <Mail className="h-4 w-4" /> {client.primaryEmail}
                    </a>
                    {client.primaryPhone && (
                      <a href={`tel:${client.primaryPhone}`} className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800">
                        <Phone className="h-4 w-4" /> {client.primaryPhone}
                      </a>
                    )}
                  </div>
                  
                  {/* Services */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {client.servicesRequired.map((service) => (
                      <span key={service} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        {getServiceLabel(service)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right: Quick Stats & Deadlines */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-4 lg:w-80">
              {/* Assigned Team */}
              {client.primaryAccountManager && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Account Manager</p>
                  <p className="font-medium text-gray-900">{client.primaryAccountManager}</p>
                </div>
              )}
              
              {/* Upcoming Deadlines */}
              {client.upcomingDeadlines.length > 0 && (
                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-xs text-orange-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Upcoming Deadlines
                  </p>
                  <div className="space-y-2">
                    {client.upcomingDeadlines.map((deadline) => (
                      <div key={deadline.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-900 truncate">{deadline.title}</span>
                        <span className="text-orange-600 font-medium ml-2">{formatDate(deadline.dueDate)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{client.stats.activeProjects}</p>
              <p className="text-xs text-gray-500">Active Projects</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{client.stats.openTasksCount}</p>
              <p className="text-xs text-gray-500">Open Tasks</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{client.stats.pendingDocsCount}</p>
              <p className="text-xs text-gray-500">Docs Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{client.stats.receivedDocsCount}</p>
              <p className="text-xs text-gray-500">Docs Received</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Tasks
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Documents
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Billing
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Notes
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Compliance
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Timeline */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">Timeline</h3>
                <div className="space-y-4">
                  {/* Completed Projects */}
                  {client.projects
                    .filter((p) => p.status === "COMPLETED" && p.completedAt)
                    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
                    .map((project) => (
                      <TimelineItem
                        key={`completed-${project.id}`}
                        icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
                        title={`Project Completed: ${project.name}`}
                        subtitle={formatDate(project.completedAt)}
                        color="green"
                      />
                    ))}
                  
                  {/* Created Projects */}
                  {client.projects
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((project) => (
                      <TimelineItem
                        key={`created-${project.id}`}
                        icon={<Briefcase className="h-4 w-4 text-purple-600" />}
                        title={`Project Created: ${project.name}`}
                        subtitle={formatDate(project.createdAt)}
                        color="purple"
                      />
                    ))}
                  
                  {client.engagementLetterSigned && (
                    <TimelineItem
                      icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
                      title="Engagement Letter Signed"
                      color="green"
                    />
                  )}
                  {client.onboardingStatus === "ONBOARDING_COMPLETE" && (
                    <TimelineItem
                      icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
                      title="Onboarding Completed"
                      color="green"
                    />
                  )}
                  {client.onboardingStatus === "IN_PROGRESS" && (
                    <TimelineItem
                      icon={<Clock className="h-4 w-4 text-yellow-600" />}
                      title="Onboarding In Progress"
                      color="yellow"
                    />
                  )}
                  <TimelineItem
                    icon={<User className="h-4 w-4 text-blue-600" />}
                    title="Client Created"
                    subtitle={formatDate(client.createdAt)}
                    color="blue"
                  />
                </div>
              </div>
              
              {/* Open Items Summary */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">Open Items</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Open Tasks</span>
                    <span className="font-semibold">{client.stats.openTasksCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Docs Requested</span>
                    <span className="font-semibold text-orange-600">{client.stats.pendingDocsCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Docs Received</span>
                    <span className="font-semibold text-green-600">{client.stats.receivedDocsCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Active Projects</span>
                    <span className="font-semibold">{client.stats.activeProjects}</span>
                  </div>
                </div>
              </div>
              
              {/* Projects List */}
              <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">Projects</h3>
                {client.projects.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No projects yet</p>
                ) : (
                  <div className="space-y-3">
                    {client.projects.map((project) => (
                      <Link 
                        key={project.id} 
                        href={`/projects/${project.id}`}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{project.name}</p>
                          <p className="text-sm text-gray-500">
                            {project.tasks.length} tasks • Due {formatDate(project.dueDate)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getTaskStatusColor(project.status)}`}>
                            {project.status.replace("_", " ")}
                          </span>
                          <ExternalLink className="h-4 w-4 text-gray-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">Tasks & Deadlines</h3>
              </div>
              {allTasks.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No tasks yet</div>
              ) : (
                <div className="divide-y">
                  {allTasks.map((task) => (
                    <div key={task.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-gray-500 truncate">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        {task.dueDate && (
                          <span className="text-sm text-gray-500">{formatDate(task.dueDate)}</span>
                        )}
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                          {task.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Documents Tab */}
          <TabsContent value="documents">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">Documents</h3>
              </div>
              {client.documents.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No documents yet</div>
              ) : (
                <div className="divide-y">
                  {client.documents.map((doc) => (
                    <div key={doc.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{doc.name}</p>
                          <p className="text-sm text-gray-500">{doc.type} • {formatDate(doc.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getTaskStatusColor(doc.status)}`}>
                          {doc.status}
                        </span>
                        {doc.fileUrl && (
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Billing Tab */}
          <TabsContent value="billing">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Billing & Payments</h3>
              <div className="text-center py-12 text-gray-500">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Billing module coming soon</p>
                <p className="text-sm mt-1">Track invoices, payments, and profitability</p>
              </div>
            </div>
          </TabsContent>
          
          {/* Notes Tab */}
          <TabsContent value="notes">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Notes & Communication</h3>
              {client.internalNotes ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 font-medium mb-2">Internal Notes</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{client.internalNotes}</p>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No notes yet</p>
                </div>
              )}
              
              {/* Tags */}
              {client.tags.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-700 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {client.tags.map((tag) => (
                      <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Compliance Tab */}
          <TabsContent value="compliance">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* KYC/AML Status */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">KYC/AML Verification</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getKycStatusIcon(client.kycAmlStatus)}
                      <span className="font-medium">KYC/AML Status</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      client.kycAmlStatus === "VERIFIED" ? "bg-green-100 text-green-800" :
                      client.kycAmlStatus === "IN_PROGRESS" ? "bg-yellow-100 text-yellow-800" :
                      client.kycAmlStatus === "FAILED" || client.kycAmlStatus === "EXPIRED" ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {client.kycAmlStatus.replace("_", " ")}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {client.governmentIdUploaded ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      )}
                      <span>Government ID</span>
                    </div>
                    <span className={`text-sm font-medium ${client.governmentIdUploaded ? "text-green-600" : "text-yellow-600"}`}>
                      {client.governmentIdUploaded ? "Uploaded" : "Pending"}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {client.businessDocsUploaded ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      )}
                      <span>Business Documents</span>
                    </div>
                    <span className={`text-sm font-medium ${client.businessDocsUploaded ? "text-green-600" : "text-yellow-600"}`}>
                      {client.businessDocsUploaded ? "Uploaded" : "Pending"}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {client.engagementLetterSigned ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      )}
                      <span>Engagement Letter</span>
                    </div>
                    <span className={`text-sm font-medium ${client.engagementLetterSigned ? "text-green-600" : "text-yellow-600"}`}>
                      {client.engagementLetterSigned ? "Signed" : "Pending"}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Risk Assessment */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">Risk Assessment</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium">Risk Rating</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(client.riskRating)}`}>
                      {client.riskRating || "Not Assessed"}
                    </span>
                  </div>
                  
                  {client.riskRating === "HIGH" || client.riskRating === "CRITICAL" ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        High Risk Flags
                      </div>
                      <ul className="text-sm text-red-700 space-y-1 ml-6 list-disc">
                        <li>Requires enhanced due diligence</li>
                        <li>Manager approval required for engagement</li>
                      </ul>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No risk flags identified</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Timeline Item Component
function TimelineItem({ 
  icon, 
  title, 
  subtitle, 
  color 
}: { 
  icon: React.ReactNode; 
  title: string; 
  subtitle?: string;
  color: "green" | "yellow" | "blue" | "red" | "purple";
}) {
  const borderColors = {
    green: "border-green-200",
    yellow: "border-yellow-200",
    blue: "border-blue-200",
    red: "border-red-200",
    purple: "border-purple-200",
  };
  
  return (
    <div className={`flex items-start gap-3 pl-4 border-l-2 ${borderColors[color]}`}>
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}
