import { AboutSection } from './sections/AboutSection';
import { ContactSection } from './sections/ContactSection';
import { HeroSection } from './sections/HeroSection';
import { SegmentsSection } from './sections/SegmentsSection';
import { SolutionsSection } from './sections/SolutionsSection';
import { ValuesSection } from './sections/ValuesSection';
import { LandingHeader } from './components/LandingHeader';
import { SiteFooter } from './components/SiteFooter';
import './landing.css';

export function LandingPage() {
  return (
    <div className="site">
      <LandingHeader />
      <main>
        <HeroSection />
        <AboutSection />
        <SolutionsSection />
        <SegmentsSection />
        <ValuesSection />
        <ContactSection />
      </main>
      <SiteFooter />
    </div>
  );
}
