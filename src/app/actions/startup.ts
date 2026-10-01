// Startup / SME server actions. Owner: startup interface.
//
// Add "use server" at the top once the first action exists, then put actions here, e.g.:
//   acceptApplicantAction(applicationId)    -> data/startup.ts acceptApplicant()
//   declineApplicantAction(applicationId)
//   verifyDeliveryAction(projectId, rating, review)
//   postCompanyProjectAction(formData)      -> like postProjectAction but with org_id set
// Always start with: const user = await requireUser(path, "company");
export {};
