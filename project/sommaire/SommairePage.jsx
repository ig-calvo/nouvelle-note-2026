/* global React, useStore, Sidebar, AllergyAdd, AllergyConsult, VitalsAdd, VitalsGrid, Prescripteur, Prescrire, ResultsList, ProblemsPanel, HabitsAdd, HabitsConsult, ActionLogPanel, ConsentModal, AuditReports, ReorderBoxes, QuickEntry, PrintSummary, ToastHost, StoreProvider */
// =========================================================
// SommairePage.jsx — complete sommaire with modal management
// =========================================================

function SommairePage() {
  const [modal, setModal] = React.useState(null);

  const handleOpen = (id) => setModal(id);
  const handleClose = () => setModal(null);

  const ModalRouter = () => {
    switch (modal) {
      case "allergies-add":
        return <AllergyAdd onClose={handleClose} />;
      case "allergies":
        return <AllergyConsult onClose={handleClose} />;
      case "vitals-add":
        return <VitalsAdd onClose={handleClose} />;
      case "vitals":
        return <VitalsGrid onClose={handleClose} />;
      case "meds-add":
        return <Prescrire onClose={handleClose} />;
      case "meds":
        return <Prescripteur onClose={handleClose} />;
      case "results":
        return <ResultsList onClose={handleClose} />;
      case "problems":
        return <ProblemsPanel onClose={handleClose} />;
      case "past":
        return <ProblemsPanel onClose={handleClose} kind="antecedent" />;
      case "habits-add":
        return <HabitsAdd onClose={handleClose} />;
      case "habits":
        return <HabitsConsult onClose={handleClose} />;
      case "action-log":
        return <ActionLogPanel onClose={handleClose} />;
      case "consent":
        return <ConsentModal onClose={handleClose} />;
      case "audit":
        return <AuditReports onClose={handleClose} />;
      case "reorder":
        return <ReorderBoxes onClose={handleClose} />;
      case "quick":
        return <QuickEntry onClose={handleClose} />;
      case "print":
        return <PrintSummary onClose={handleClose} />;
      default:
        return null;
    }
  };

  return (
    <StoreProvider>
      <Sidebar onOpen={handleOpen} />
      <ModalRouter />
      <ToastHost />
    </StoreProvider>
  );
}

Object.assign(window, { SommairePage });
