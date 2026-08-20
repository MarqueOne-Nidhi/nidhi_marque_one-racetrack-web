import React from 'react';
import BusinessSection from '../components/business/Business';
import InConfidence from '../components/business/InConfidence';
import Enquiry from '../components/home/Enquiry';

/**
 * Business: the commercial offer, lifted off the home page onto its own
 * route so a company arriving for a launch or a test day does not have to
 * scroll a page written for drivers to find it.
 *
 * Surface run: light → dark-raised → dark, then the footer's dark-raised.
 * No two touching sections share a value, and the family flips once so the
 * page does not read as one continuous block. See ui/Section.jsx.
 *
 * The enquiry form opens on its Business toggle, since that is the only
 * reason anyone reaches the bottom of this page.
 */
export default function Business() {
  return (
    <div className="w-full">
      <BusinessSection />
      <InConfidence />
      <Enquiry initialType="Business" heading="Partner with us." source="Business page form" />
    </div>
  );
}
