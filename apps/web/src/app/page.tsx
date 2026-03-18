'use client';

import { useEffect } from 'react';
import FloatingNav from '@/components/landing/FloatingNav';
import HeroSection from '@/components/landing/HeroSection';
import BrandMarquee from '@/components/landing/BrandMarquee';
import PhoneDemo from '@/components/landing/PhoneDemo';
import FeatureSection from '@/components/landing/FeatureSection';
import BenefitsGrid from '@/components/landing/BenefitsGrid';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import PricingSection from '@/components/landing/PricingSection';
import ClosingCTA from '@/components/landing/ClosingCTA';
import Footer from '@/components/landing/Footer';

export default function Home() {
  useEffect(() => {
    // Initialize scroll reveal observer
    const revealElements = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ background: 'var(--bg-sky)' }}>
      <FloatingNav />
      <HeroSection />
      <BrandMarquee />
      <PhoneDemo />
      <FeatureSection variant="order-management" />
      <FeatureSection variant="savings-analytics" reversed />
      <BenefitsGrid />
      <TestimonialsSection />
      <PricingSection />
      <ClosingCTA />
      <Footer />
    </div>
  );
}
