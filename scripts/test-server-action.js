// This script simulates what the frontend should be doing
// Run this to test if the server action works when called directly

const testData = {
  clientType: "INDIVIDUAL",
  legalName: "Test Direct Call",
  preferredName: "Test",
  primaryEmail: "test@example.com",
  primaryPhone: "",
  mailingStreet: "",
  mailingCity: "",
  mailingState: "",
  mailingZip: "",
  mailingCountry: "",
  billingAddressSame: true,
  billingStreet: "",
  billingCity: "",
  billingState: "",
  billingZip: "",
  billingCountry: "",
  servicesRequired: ["TAX_PREPARATION"],
  engagementStartDate: null,
  primaryAccountManager: null,
  billingPreference: "MONTHLY",
  onboardingStatus: "PENDING_DOCS",
  shareholders: [],
  accountingSoftware: "NONE",
  fiscalYearStartMonth: 1,
  tags: [],
  internalNotes: "",
  clientRelationships: [],
};

console.log("Test data prepared:");
console.log(JSON.stringify(testData, null, 2));
console.log("\nTo test the server action:");
console.log("1. The form should call createClient(testData)");
console.log("2. This should trigger [CREATE CLIENT] logs on the server");
console.log("3. If no logs appear, the action is not being called");
console.log("\nPossible issues:");
console.log("- Form validation preventing submission");
console.log("- JavaScript error in the browser");
console.log("- Network request failing");
console.log("- Server action not properly exported");
