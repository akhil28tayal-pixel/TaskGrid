"use client";

import * as React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  User, 
  Building2, 
  Mail, 
  MapPin, 
  Briefcase, 
  Shield, 
  Calculator, 
  FileText,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";

// Types
type ClientType = "INDIVIDUAL" | "BUSINESS" | "TRUST" | "NONPROFIT";
type EntityType = "LLC" | "S_CORP" | "C_CORP" | "PARTNERSHIP" | "SOLE_PROPRIETORSHIP" | "LLP" | "CCPC" | "OTHER_PRIVATE_CORPORATION" | "PUBLIC_CORPORATION" | "OTHER";
type ServiceType = "TAX_PREPARATION" | "BOOKKEEPING" | "PAYROLL" | "AUDIT" | "REVIEW" | "COMPILATION" | "ADVISORY" | "HST_SERVICES" | "TAX_REORGANIZATION" | "OTHER";
type BillingPreference = "HOURLY" | "FIXED_FEE" | "MONTHLY" | "QUARTERLY" | "ANNUALLY" | "PROJECT_BASED";
type OnboardingStatus = "PENDING_DOCS" | "IN_PROGRESS" | "ONBOARDING_COMPLETE" | "ON_HOLD";
type KycAmlStatus = "NOT_STARTED" | "IN_PROGRESS" | "VERIFIED" | "FAILED" | "EXPIRED";
type AccountingSoftware = "QUICKBOOKS_ONLINE" | "QUICKBOOKS_DESKTOP" | "XERO" | "FRESHBOOKS" | "WAVE" | "SAGE" | "ZOHO_BOOKS" | "ERP_SYSTEM" | "NONE" | "OTHER";
type RiskRating = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ClientFormData {
  clientType: ClientType;
  legalName: string;
  preferredName: string;
  entityType: EntityType | "";
  taxId: string;
  dateOfIncorporation: string;
  primaryEmail: string;
  primaryPhone: string;
  mailingStreet: string;
  mailingCity: string;
  mailingState: string;
  mailingZip: string;
  mailingCountry: string;
  billingAddressSame: boolean;
  billingStreet: string;
  billingCity: string;
  billingState: string;
  billingZip: string;
  billingCountry: string;
  servicesRequired: ServiceType[];
  engagementStartDate: string;
  primaryAccountManager: string;
  billingPreference: BillingPreference;
  onboardingStatus: OnboardingStatus;
  kycAmlStatus: KycAmlStatus;
  governmentIdUploaded: boolean;
  businessDocsUploaded: boolean;
  engagementLetterSigned: boolean;
  accountingSoftware: AccountingSoftware | "";
  fiscalYearStartMonth: number;
  tags: string[];
  internalNotes: string;
  riskRating: RiskRating | "";
}

const initialFormData: ClientFormData = {
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
  mailingCountry: "CA",
  billingAddressSame: true,
  billingStreet: "",
  billingCity: "",
  billingState: "",
  billingZip: "",
  billingCountry: "",
  servicesRequired: [],
  engagementStartDate: "",
  primaryAccountManager: "",
  billingPreference: "MONTHLY",
  onboardingStatus: "PENDING_DOCS",
  kycAmlStatus: "NOT_STARTED",
  governmentIdUploaded: false,
  businessDocsUploaded: false,
  engagementLetterSigned: false,
  accountingSoftware: "",
  fiscalYearStartMonth: 1,
  tags: [],
  internalNotes: "",
  riskRating: "",
};

const STEPS = [
  { id: 1, title: "Identification", icon: User },
  { id: 2, title: "Contact", icon: Mail },
  { id: 3, title: "Engagement", icon: Briefcase },
  { id: 4, title: "Compliance", icon: Shield },
  { id: 5, title: "Accounting", icon: Calculator },
  { id: 6, title: "Notes", icon: FileText },
];

const CLIENT_TYPES = [
  { value: "INDIVIDUAL", label: "Individual" },
  { value: "BUSINESS", label: "Business" },
  { value: "TRUST", label: "Trust" },
  { value: "NONPROFIT", label: "Nonprofit" },
];

const ENTITY_TYPES = [
  { value: "LLC", label: "LLC" },
  { value: "S_CORP", label: "S-Corp" },
  { value: "C_CORP", label: "C-Corp" },
  { value: "PARTNERSHIP", label: "Partnership" },
  { value: "SOLE_PROPRIETORSHIP", label: "Sole Proprietorship" },
  { value: "LLP", label: "LLP" },
  { value: "CCPC", label: "CCPC" },
  { value: "OTHER_PRIVATE_CORPORATION", label: "Other Private Corporation" },
  { value: "PUBLIC_CORPORATION", label: "Public Corporation" },
  { value: "OTHER", label: "Other" },
];

const SERVICE_TYPES = [
  { value: "TAX_PREPARATION", label: "Tax Preparation" },
  { value: "BOOKKEEPING", label: "Bookkeeping" },
  { value: "PAYROLL", label: "Payroll" },
  { value: "AUDIT", label: "Audit" },
  { value: "REVIEW", label: "Review" },
  { value: "COMPILATION", label: "Compilation" },
  { value: "ADVISORY", label: "Advisory" },
  { value: "HST_SERVICES", label: "HST Services" },
  { value: "TAX_REORGANIZATION", label: "Tax Reorganization" },
  { value: "OTHER", label: "Other" },
];

const BILLING_PREFERENCES = [
  { value: "HOURLY", label: "Hourly" },
  { value: "FIXED_FEE", label: "Fixed Fee" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "ANNUALLY", label: "Annually" },
  { value: "PROJECT_BASED", label: "Project Based" },
];

const ONBOARDING_STATUSES = [
  { value: "PENDING_DOCS", label: "Pending Documents" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "ONBOARDING_COMPLETE", label: "Complete" },
  { value: "ON_HOLD", label: "On Hold" },
];

const KYC_STATUSES = [
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "VERIFIED", label: "Verified" },
  { value: "FAILED", label: "Failed" },
  { value: "EXPIRED", label: "Expired" },
];

const COUNTRIES = [
  { value: "CA", label: "Canada" },
  { value: "US", label: "United States" },
  { value: "AF", label: "Afghanistan" },
  { value: "AL", label: "Albania" },
  { value: "DZ", label: "Algeria" },
  { value: "AD", label: "Andorra" },
  { value: "AO", label: "Angola" },
  { value: "AG", label: "Antigua and Barbuda" },
  { value: "AR", label: "Argentina" },
  { value: "AM", label: "Armenia" },
  { value: "AU", label: "Australia" },
  { value: "AT", label: "Austria" },
  { value: "AZ", label: "Azerbaijan" },
  { value: "BS", label: "Bahamas" },
  { value: "BH", label: "Bahrain" },
  { value: "BD", label: "Bangladesh" },
  { value: "BB", label: "Barbados" },
  { value: "BY", label: "Belarus" },
  { value: "BE", label: "Belgium" },
  { value: "BZ", label: "Belize" },
  { value: "BJ", label: "Benin" },
  { value: "BT", label: "Bhutan" },
  { value: "BO", label: "Bolivia" },
  { value: "BA", label: "Bosnia and Herzegovina" },
  { value: "BW", label: "Botswana" },
  { value: "BR", label: "Brazil" },
  { value: "BN", label: "Brunei" },
  { value: "BG", label: "Bulgaria" },
  { value: "BF", label: "Burkina Faso" },
  { value: "BI", label: "Burundi" },
  { value: "KH", label: "Cambodia" },
  { value: "CM", label: "Cameroon" },
  { value: "CV", label: "Cape Verde" },
  { value: "CF", label: "Central African Republic" },
  { value: "TD", label: "Chad" },
  { value: "CL", label: "Chile" },
  { value: "CN", label: "China" },
  { value: "CO", label: "Colombia" },
  { value: "KM", label: "Comoros" },
  { value: "CG", label: "Congo" },
  { value: "CR", label: "Costa Rica" },
  { value: "HR", label: "Croatia" },
  { value: "CU", label: "Cuba" },
  { value: "CY", label: "Cyprus" },
  { value: "CZ", label: "Czech Republic" },
  { value: "DK", label: "Denmark" },
  { value: "DJ", label: "Djibouti" },
  { value: "DM", label: "Dominica" },
  { value: "DO", label: "Dominican Republic" },
  { value: "EC", label: "Ecuador" },
  { value: "EG", label: "Egypt" },
  { value: "SV", label: "El Salvador" },
  { value: "GQ", label: "Equatorial Guinea" },
  { value: "ER", label: "Eritrea" },
  { value: "EE", label: "Estonia" },
  { value: "ET", label: "Ethiopia" },
  { value: "FJ", label: "Fiji" },
  { value: "FI", label: "Finland" },
  { value: "FR", label: "France" },
  { value: "GA", label: "Gabon" },
  { value: "GM", label: "Gambia" },
  { value: "GE", label: "Georgia" },
  { value: "DE", label: "Germany" },
  { value: "GH", label: "Ghana" },
  { value: "GR", label: "Greece" },
  { value: "GD", label: "Grenada" },
  { value: "GT", label: "Guatemala" },
  { value: "GN", label: "Guinea" },
  { value: "GW", label: "Guinea-Bissau" },
  { value: "GY", label: "Guyana" },
  { value: "HT", label: "Haiti" },
  { value: "HN", label: "Honduras" },
  { value: "HK", label: "Hong Kong" },
  { value: "HU", label: "Hungary" },
  { value: "IS", label: "Iceland" },
  { value: "IN", label: "India" },
  { value: "ID", label: "Indonesia" },
  { value: "IR", label: "Iran" },
  { value: "IQ", label: "Iraq" },
  { value: "IE", label: "Ireland" },
  { value: "IL", label: "Israel" },
  { value: "IT", label: "Italy" },
  { value: "JM", label: "Jamaica" },
  { value: "JP", label: "Japan" },
  { value: "JO", label: "Jordan" },
  { value: "KZ", label: "Kazakhstan" },
  { value: "KE", label: "Kenya" },
  { value: "KI", label: "Kiribati" },
  { value: "KP", label: "North Korea" },
  { value: "KR", label: "South Korea" },
  { value: "KW", label: "Kuwait" },
  { value: "KG", label: "Kyrgyzstan" },
  { value: "LA", label: "Laos" },
  { value: "LV", label: "Latvia" },
  { value: "LB", label: "Lebanon" },
  { value: "LS", label: "Lesotho" },
  { value: "LR", label: "Liberia" },
  { value: "LY", label: "Libya" },
  { value: "LI", label: "Liechtenstein" },
  { value: "LT", label: "Lithuania" },
  { value: "LU", label: "Luxembourg" },
  { value: "MO", label: "Macau" },
  { value: "MK", label: "North Macedonia" },
  { value: "MG", label: "Madagascar" },
  { value: "MW", label: "Malawi" },
  { value: "MY", label: "Malaysia" },
  { value: "MV", label: "Maldives" },
  { value: "ML", label: "Mali" },
  { value: "MT", label: "Malta" },
  { value: "MH", label: "Marshall Islands" },
  { value: "MR", label: "Mauritania" },
  { value: "MU", label: "Mauritius" },
  { value: "MX", label: "Mexico" },
  { value: "FM", label: "Micronesia" },
  { value: "MD", label: "Moldova" },
  { value: "MC", label: "Monaco" },
  { value: "MN", label: "Mongolia" },
  { value: "ME", label: "Montenegro" },
  { value: "MA", label: "Morocco" },
  { value: "MZ", label: "Mozambique" },
  { value: "MM", label: "Myanmar" },
  { value: "NA", label: "Namibia" },
  { value: "NR", label: "Nauru" },
  { value: "NP", label: "Nepal" },
  { value: "NL", label: "Netherlands" },
  { value: "NZ", label: "New Zealand" },
  { value: "NI", label: "Nicaragua" },
  { value: "NE", label: "Niger" },
  { value: "NG", label: "Nigeria" },
  { value: "NO", label: "Norway" },
  { value: "OM", label: "Oman" },
  { value: "PK", label: "Pakistan" },
  { value: "PW", label: "Palau" },
  { value: "PS", label: "Palestine" },
  { value: "PA", label: "Panama" },
  { value: "PG", label: "Papua New Guinea" },
  { value: "PY", label: "Paraguay" },
  { value: "PE", label: "Peru" },
  { value: "PH", label: "Philippines" },
  { value: "PL", label: "Poland" },
  { value: "PT", label: "Portugal" },
  { value: "QA", label: "Qatar" },
  { value: "RO", label: "Romania" },
  { value: "RU", label: "Russia" },
  { value: "RW", label: "Rwanda" },
  { value: "KN", label: "Saint Kitts and Nevis" },
  { value: "LC", label: "Saint Lucia" },
  { value: "VC", label: "Saint Vincent and the Grenadines" },
  { value: "WS", label: "Samoa" },
  { value: "SM", label: "San Marino" },
  { value: "ST", label: "Sao Tome and Principe" },
  { value: "SA", label: "Saudi Arabia" },
  { value: "SN", label: "Senegal" },
  { value: "RS", label: "Serbia" },
  { value: "SC", label: "Seychelles" },
  { value: "SL", label: "Sierra Leone" },
  { value: "SG", label: "Singapore" },
  { value: "SK", label: "Slovakia" },
  { value: "SI", label: "Slovenia" },
  { value: "SB", label: "Solomon Islands" },
  { value: "SO", label: "Somalia" },
  { value: "ZA", label: "South Africa" },
  { value: "SS", label: "South Sudan" },
  { value: "ES", label: "Spain" },
  { value: "LK", label: "Sri Lanka" },
  { value: "SD", label: "Sudan" },
  { value: "SR", label: "Suriname" },
  { value: "SZ", label: "Eswatini" },
  { value: "SE", label: "Sweden" },
  { value: "CH", label: "Switzerland" },
  { value: "SY", label: "Syria" },
  { value: "TW", label: "Taiwan" },
  { value: "TJ", label: "Tajikistan" },
  { value: "TZ", label: "Tanzania" },
  { value: "TH", label: "Thailand" },
  { value: "TL", label: "Timor-Leste" },
  { value: "TG", label: "Togo" },
  { value: "TO", label: "Tonga" },
  { value: "TT", label: "Trinidad and Tobago" },
  { value: "TN", label: "Tunisia" },
  { value: "TR", label: "Turkey" },
  { value: "TM", label: "Turkmenistan" },
  { value: "TV", label: "Tuvalu" },
  { value: "UG", label: "Uganda" },
  { value: "UA", label: "Ukraine" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "GB", label: "United Kingdom" },
  { value: "UY", label: "Uruguay" },
  { value: "UZ", label: "Uzbekistan" },
  { value: "VU", label: "Vanuatu" },
  { value: "VA", label: "Vatican City" },
  { value: "VE", label: "Venezuela" },
  { value: "VN", label: "Vietnam" },
  { value: "YE", label: "Yemen" },
  { value: "ZM", label: "Zambia" },
  { value: "ZW", label: "Zimbabwe" },
];

const ACCOUNTING_SOFTWARE = [
  { value: "QUICKBOOKS_ONLINE", label: "QuickBooks Online" },
  { value: "QUICKBOOKS_DESKTOP", label: "QuickBooks Desktop" },
  { value: "XERO", label: "Xero" },
  { value: "FRESHBOOKS", label: "FreshBooks" },
  { value: "WAVE", label: "Wave" },
  { value: "SAGE", label: "Sage" },
  { value: "ZOHO_BOOKS", label: "Zoho Books" },
  { value: "ERP_SYSTEM", label: "ERP System" },
  { value: "NONE", label: "None" },
  { value: "OTHER", label: "Other" },
];

const RISK_RATINGS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ClientFormData) => Promise<void>;
  teamMembers?: TeamMember[];
}

export function CreateClientDialog({ open, onOpenChange, onSubmit, teamMembers = [] }: CreateClientDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ClientFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  
  // Filter to only show Partners and Managers
  const managers = teamMembers.filter(m => m.role === "PARTNER" || m.role === "MANAGER");

  const updateFormData = <K extends keyof ClientFormData>(field: K, value: ClientFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleService = (service: ServiceType) => {
    setFormData((prev) => ({
      ...prev,
      servicesRequired: prev.servicesRequired.includes(service)
        ? prev.servicesRequired.filter((s) => s !== service)
        : [...prev.servicesRequired, service],
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleNext = () => currentStep < STEPS.length && setCurrentStep((prev) => prev + 1);
  const handleBack = () => currentStep > 1 && setCurrentStep((prev) => prev - 1);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData(initialFormData);
      setCurrentStep(1);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to create client:", error);
      alert(error?.message || "Failed to create client. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setCurrentStep(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Client</DialogTitle>
          <DialogDescription>
            Fill in the client information. Step {currentStep} of {STEPS.length}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-1 px-2 py-4 border-b overflow-x-auto">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-shrink-0">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium ${
                currentStep === step.id
                  ? "bg-blue-600 text-white"
                  : currentStep > step.id
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}>
                {currentStep > step.id ? "✓" : step.id}
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-6 h-0.5 mx-1 ${
                  currentStep > step.id ? "bg-green-500" : "bg-gray-200"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto py-4 px-1">
          {currentStep === 1 && <Step1Identification formData={formData} updateFormData={updateFormData} />}
          {currentStep === 2 && <Step2Contact formData={formData} updateFormData={updateFormData} />}
          {currentStep === 3 && <Step3Engagement formData={formData} updateFormData={updateFormData} toggleService={toggleService} managers={managers} />}
          {currentStep === 4 && <Step4Compliance formData={formData} updateFormData={updateFormData} />}
          {currentStep === 5 && <Step5Accounting formData={formData} updateFormData={updateFormData} />}
          {currentStep === 6 && <Step6Notes formData={formData} updateFormData={updateFormData} tagInput={tagInput} setTagInput={setTagInput} addTag={addTag} removeTag={removeTag} />}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t pt-4">
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              {currentStep === STEPS.length ? (
                <Button onClick={handleSubmit} disabled={isSubmitting || !formData.legalName || !formData.primaryEmail}>
                  {isSubmitting ? "Creating..." : "Create Client"}
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Step Components
function Step1Identification({ formData, updateFormData }: { formData: ClientFormData; updateFormData: <K extends keyof ClientFormData>(field: K, value: ClientFormData[K]) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Client Type *</Label>
        <Select value={formData.clientType} onValueChange={(v) => updateFormData("clientType", v as ClientType)}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CLIENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>{formData.clientType === "INDIVIDUAL" ? "Full Legal Name *" : "Business Legal Name *"}</Label>
        <Input className="mt-1" value={formData.legalName} onChange={(e) => updateFormData("legalName", e.target.value)} placeholder={formData.clientType === "INDIVIDUAL" ? "John Doe" : "Acme Corp"} />
      </div>
      <div>
        <Label>Preferred Name</Label>
        <Input className="mt-1" value={formData.preferredName} onChange={(e) => updateFormData("preferredName", e.target.value)} placeholder="Optional" />
      </div>
      {formData.clientType !== "INDIVIDUAL" && (
        <div>
          <Label>Entity Type</Label>
          <Select value={formData.entityType} onValueChange={(v) => updateFormData("entityType", v as EntityType)}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select entity type" /></SelectTrigger>
            <SelectContent>
              {ENTITY_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{formData.clientType === "INDIVIDUAL" ? "SSN" : "Business No. / Tax ID / EIN"}</Label>
          <Input className="mt-1" value={formData.taxId} onChange={(e) => updateFormData("taxId", e.target.value)} placeholder={formData.clientType === "INDIVIDUAL" ? "XXX-XX-XXXX" : "XX-XXXXXXX"} />
        </div>
        <div>
          <Label>{formData.clientType === "INDIVIDUAL" ? "Date of Birth" : "Date of Incorporation"}</Label>
          <Input className="mt-1" type="date" value={formData.dateOfIncorporation} onChange={(e) => updateFormData("dateOfIncorporation", e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function Step2Contact({ formData, updateFormData }: { formData: ClientFormData; updateFormData: <K extends keyof ClientFormData>(field: K, value: ClientFormData[K]) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Primary Email *</Label>
          <Input className="mt-1" type="email" value={formData.primaryEmail} onChange={(e) => updateFormData("primaryEmail", e.target.value)} placeholder="email@example.com" />
        </div>
        <div>
          <Label>Primary Phone</Label>
          <Input className="mt-1" type="tel" value={formData.primaryPhone} onChange={(e) => updateFormData("primaryPhone", e.target.value)} placeholder="(555) 123-4567" />
        </div>
      </div>
      <div className="border-t pt-4">
        <h4 className="font-medium mb-3 flex items-center gap-2"><MapPin className="h-4 w-4" /> Mailing Address</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Street Address</Label>
            <Input className="mt-1" value={formData.mailingStreet} onChange={(e) => updateFormData("mailingStreet", e.target.value)} placeholder="123 Main St" />
          </div>
          <div><Label>City</Label><Input className="mt-1" value={formData.mailingCity} onChange={(e) => updateFormData("mailingCity", e.target.value)} /></div>
          <div><Label>State / Province</Label><Input className="mt-1" value={formData.mailingState} onChange={(e) => updateFormData("mailingState", e.target.value)} /></div>
          <div><Label>ZIP / Postal Code</Label><Input className="mt-1" value={formData.mailingZip} onChange={(e) => updateFormData("mailingZip", e.target.value)} /></div>
          <div>
            <Label>Country</Label>
            <Select value={formData.mailingCountry} onValueChange={(v) => updateFormData("mailingCountry", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select country" /></SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {COUNTRIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="billingSame" checked={formData.billingAddressSame} onCheckedChange={(c) => updateFormData("billingAddressSame", c as boolean)} />
        <Label htmlFor="billingSame" className="font-normal">Billing address same as mailing</Label>
      </div>
      {!formData.billingAddressSame && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3 flex items-center gap-2"><Building2 className="h-4 w-4" /> Billing Address</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Street</Label><Input className="mt-1" value={formData.billingStreet} onChange={(e) => updateFormData("billingStreet", e.target.value)} /></div>
            <div><Label>City</Label><Input className="mt-1" value={formData.billingCity} onChange={(e) => updateFormData("billingCity", e.target.value)} /></div>
            <div><Label>State / Province</Label><Input className="mt-1" value={formData.billingState} onChange={(e) => updateFormData("billingState", e.target.value)} /></div>
            <div><Label>ZIP / Postal Code</Label><Input className="mt-1" value={formData.billingZip} onChange={(e) => updateFormData("billingZip", e.target.value)} /></div>
            <div>
              <Label>Country</Label>
              <Select value={formData.billingCountry} onValueChange={(v) => updateFormData("billingCountry", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {COUNTRIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Step3Engagement({ formData, updateFormData, toggleService, managers }: { formData: ClientFormData; updateFormData: <K extends keyof ClientFormData>(field: K, value: ClientFormData[K]) => void; toggleService: (s: ServiceType) => void; managers: { id: string; name: string | null; email: string; role: string }[] }) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-3 block">Services Required</Label>
        <div className="grid grid-cols-2 gap-2">
          {SERVICE_TYPES.map((s) => (
            <div key={s.value} className="flex items-center space-x-2">
              <Checkbox id={s.value} checked={formData.servicesRequired.includes(s.value as ServiceType)} onCheckedChange={() => toggleService(s.value as ServiceType)} />
              <Label htmlFor={s.value} className="font-normal">{s.label}</Label>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Engagement Start Date</Label><Input className="mt-1" type="date" value={formData.engagementStartDate} onChange={(e) => updateFormData("engagementStartDate", e.target.value)} /></div>
        <div>
          <Label>Primary CPA / Manager</Label>
          <Select value={formData.primaryAccountManager} onValueChange={(v) => updateFormData("primaryAccountManager", v)}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select manager" /></SelectTrigger>
            <SelectContent>
              {managers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name || m.email} ({m.role === "PARTNER" ? "Partner" : "Manager"})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Billing Preference</Label>
          <Select value={formData.billingPreference} onValueChange={(v) => updateFormData("billingPreference", v as BillingPreference)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{BILLING_PREFERENCES.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Onboarding Status</Label>
          <Select value={formData.onboardingStatus} onValueChange={(v) => updateFormData("onboardingStatus", v as OnboardingStatus)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{ONBOARDING_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function Step4Compliance({ formData, updateFormData }: { formData: ClientFormData; updateFormData: <K extends keyof ClientFormData>(field: K, value: ClientFormData[K]) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>KYC/AML Verification Status</Label>
        <Select value={formData.kycAmlStatus} onValueChange={(v) => updateFormData("kycAmlStatus", v as KycAmlStatus)}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{KYC_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="border rounded-lg p-4 space-y-3">
        <h4 className="font-medium">Document Requirements</h4>
        <div className="flex items-center space-x-2">
          <Checkbox id="govId" checked={formData.governmentIdUploaded} onCheckedChange={(c) => updateFormData("governmentIdUploaded", c as boolean)} />
          <Label htmlFor="govId" className="font-normal">Government ID / Business Registration Uploaded</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="bizDocs" checked={formData.businessDocsUploaded} onCheckedChange={(c) => updateFormData("businessDocsUploaded", c as boolean)} />
          <Label htmlFor="bizDocs" className="font-normal">Business Documents Uploaded</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="engLetter" checked={formData.engagementLetterSigned} onCheckedChange={(c) => updateFormData("engagementLetterSigned", c as boolean)} />
          <Label htmlFor="engLetter" className="font-normal">Signed Engagement Letter Received</Label>
        </div>
      </div>
    </div>
  );
}

function Step5Accounting({ formData, updateFormData }: { formData: ClientFormData; updateFormData: <K extends keyof ClientFormData>(field: K, value: ClientFormData[K]) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Accounting Software</Label>
        <Select value={formData.accountingSoftware} onValueChange={(v) => updateFormData("accountingSoftware", v as AccountingSoftware)}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Select software" /></SelectTrigger>
          <SelectContent>{ACCOUNTING_SOFTWARE.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Fiscal Year Start Month</Label>
        <Select value={formData.fiscalYearStartMonth.toString()} onValueChange={(v) => updateFormData("fiscalYearStartMonth", parseInt(v))}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{MONTHS.map((m) => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>
  );
}

function Step6Notes({ formData, updateFormData, tagInput, setTagInput, addTag, removeTag }: { formData: ClientFormData; updateFormData: <K extends keyof ClientFormData>(field: K, value: ClientFormData[K]) => void; tagInput: string; setTagInput: (v: string) => void; addTag: () => void; removeTag: (t: string) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Tags / Categories</Label>
        <div className="flex gap-2 mt-1">
          <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add tag (e.g., High Value, Healthcare)" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} />
          <Button type="button" variant="outline" onClick={addTag}>Add</Button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-600"><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}
      </div>
      <div>
        <Label>Internal Notes</Label>
        <Textarea className="mt-1" value={formData.internalNotes} onChange={(e) => updateFormData("internalNotes", e.target.value)} placeholder="Notes visible only to staff..." rows={4} />
      </div>
      <div>
        <Label>Risk Rating</Label>
        <Select value={formData.riskRating} onValueChange={(v) => updateFormData("riskRating", v as RiskRating)}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Select risk rating" /></SelectTrigger>
          <SelectContent>{RISK_RATINGS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>
  );
}
