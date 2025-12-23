"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { getClientById, updateClient } from "@/app/actions/clients";

interface EditClientPageProps {
  params: { id: string };
}

export default function EditClientPage({ params }: EditClientPageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    clientType: "INDIVIDUAL",
    legalName: "",
    preferredName: "",
    entityType: "",
    taxId: "",
    dateOfIncorporation: "",
    primaryEmail: "",
    primaryPhone: "",
    mailingStreet: "",
    mailingCity: "",
    mailingState: "",
    mailingZip: "",
    mailingCountry: "USA",
    billingAddressSame: true,
    billingStreet: "",
    billingCity: "",
    billingState: "",
    billingZip: "",
    billingCountry: "",
    servicesRequired: [] as string[],
    engagementStartDate: "",
    primaryAccountManager: "",
    billingPreference: "MONTHLY",
    onboardingStatus: "PENDING_DOCS",
    accountingSoftware: "",
    fiscalYearStartMonth: 1,
    tags: [] as string[],
    internalNotes: "",
  });

  useEffect(() => {
    async function loadClient() {
      const result = await getClientById(params.id);
      if (result.success && result.client) {
        const client = result.client;
        setFormData({
          clientType: client.clientType || "INDIVIDUAL",
          legalName: client.legalName || "",
          preferredName: client.preferredName || "",
          entityType: client.entityType || "",
          taxId: client.taxId || "",
          dateOfIncorporation: client.dateOfIncorporation 
            ? new Date(client.dateOfIncorporation).toISOString().split("T")[0] 
            : "",
          primaryEmail: client.primaryEmail || "",
          primaryPhone: client.primaryPhone || "",
          mailingStreet: client.mailingStreet || "",
          mailingCity: client.mailingCity || "",
          mailingState: client.mailingState || "",
          mailingZip: client.mailingZip || "",
          mailingCountry: client.mailingCountry || "USA",
          billingAddressSame: client.billingAddressSame ?? true,
          billingStreet: client.billingStreet || "",
          billingCity: client.billingCity || "",
          billingState: client.billingState || "",
          billingZip: client.billingZip || "",
          billingCountry: client.billingCountry || "",
          servicesRequired: client.servicesRequired || [],
          engagementStartDate: client.engagementStartDate 
            ? new Date(client.engagementStartDate).toISOString().split("T")[0] 
            : "",
          primaryAccountManager: client.primaryAccountManager || "",
          billingPreference: client.billingPreference || "MONTHLY",
          onboardingStatus: client.onboardingStatus || "PENDING_DOCS",
          accountingSoftware: client.accountingSoftware || "",
          fiscalYearStartMonth: client.fiscalYearStartMonth || 1,
          tags: client.tags || [],
          internalNotes: client.internalNotes || "",
        });
      } else {
        setError("Client not found");
      }
      setIsLoading(false);
    }
    loadClient();
  }, [params.id]);

  // Redirect non-partners
  useEffect(() => {
    if (session && userRole !== "PARTNER") {
      router.push(`/clients/${params.id}`);
    }
  }, [session, userRole, params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const result = await updateClient(params.id, formData);
      if (result.success) {
        router.push(`/clients/${params.id}`);
      } else {
        setError(result.error || "Failed to update client");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error && !formData.legalName) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <Button asChild className="mt-4">
          <Link href="/clients">Back to Clients</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/clients/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Client</h1>
          <p className="text-gray-500">Update client information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="clientType">Client Type</Label>
                <Select
                  value={formData.clientType}
                  onValueChange={(value) => setFormData({ ...formData, clientType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                    <SelectItem value="BUSINESS">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="legalName">Legal Name *</Label>
                <Input
                  id="legalName"
                  value={formData.legalName}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredName">Preferred Name</Label>
                <Input
                  id="preferredName"
                  value={formData.preferredName}
                  onChange={(e) => setFormData({ ...formData, preferredName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryEmail">Primary Email *</Label>
                <Input
                  id="primaryEmail"
                  type="email"
                  value={formData.primaryEmail}
                  onChange={(e) => setFormData({ ...formData, primaryEmail: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryPhone">Primary Phone</Label>
                <Input
                  id="primaryPhone"
                  type="tel"
                  value={formData.primaryPhone}
                  onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID / SSN / EIN</Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mailingStreet">Street Address</Label>
                  <Input
                    id="mailingStreet"
                    value={formData.mailingStreet}
                    onChange={(e) => setFormData({ ...formData, mailingStreet: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mailingCity">City</Label>
                  <Input
                    id="mailingCity"
                    value={formData.mailingCity}
                    onChange={(e) => setFormData({ ...formData, mailingCity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mailingState">State</Label>
                  <Input
                    id="mailingState"
                    value={formData.mailingState}
                    onChange={(e) => setFormData({ ...formData, mailingState: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mailingZip">ZIP Code</Label>
                  <Input
                    id="mailingZip"
                    value={formData.mailingZip}
                    onChange={(e) => setFormData({ ...formData, mailingZip: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Engagement Details */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="billingPreference">Billing Preference</Label>
                <Select
                  value={formData.billingPreference}
                  onValueChange={(value) => setFormData({ ...formData, billingPreference: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="ANNUALLY">Annually</SelectItem>
                    <SelectItem value="PROJECT_BASED">Project Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="onboardingStatus">Onboarding Status</Label>
                <Select
                  value={formData.onboardingStatus}
                  onValueChange={(value) => setFormData({ ...formData, onboardingStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING_DOCS">Pending Documents</SelectItem>
                    <SelectItem value="DOCS_RECEIVED">Documents Received</SelectItem>
                    <SelectItem value="IN_REVIEW">In Review</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="internalNotes">Internal Notes</Label>
                <Textarea
                  id="internalNotes"
                  value={formData.internalNotes}
                  onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href={`/clients/${params.id}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
