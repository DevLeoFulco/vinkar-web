import { Outlet } from 'react-router-dom';
import { DemoFooter, DemoHeader, DemoNotice } from '../../features/demo/DemoShell';
import '../../features/demo/demo.css';

export function DemoLayout() {
  return (
    <div className="demo-app">
      <DemoHeader />
      <DemoNotice />
      <Outlet />
      <DemoFooter />
    </div>
  );
}
