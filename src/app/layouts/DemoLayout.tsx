import { Outlet } from 'react-router-dom';
import { DemoFooter, DemoHeader, DemoNotice } from '../../features/demo/DemoShell';
import { DemoScenarioProvider } from '../../features/demo/DemoScenarioContext';
import { DemoMembershipRequestProvider } from '../../features/demo/DemoMembershipRequests';
import { ConsumerRegistrationProvider } from '../../features/demo/ConsumerRegistrationContext';
import { useDemoScenario } from '../../features/demo/useDemoScenario';
import '../../features/demo/demo.css';

function DemoLayoutContent() {
  const { activeScenario } = useDemoScenario();

  return (
    <div className="demo-app" data-demo-scenario-id={activeScenario?.id}>
      <DemoHeader />
      <DemoNotice />
      <Outlet />
      <DemoFooter />
    </div>
  );
}

export function DemoLayout() {
  return (
    <ConsumerRegistrationProvider>
      <DemoMembershipRequestProvider>
        <DemoScenarioProvider>
          <DemoLayoutContent />
        </DemoScenarioProvider>
      </DemoMembershipRequestProvider>
    </ConsumerRegistrationProvider>
  );
}
