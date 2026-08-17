import React from 'react';
import { Section } from '../components/ui/Section';
import { useLocation } from 'react-router-dom';
import Enquiry from '../components/home/Enquiry';
import ImageSlot from '../components/ImageSlot';
import IMAGES from '../data/images';
import { LOCATION } from '../data/home';

export default function Contact() {
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const typeParam = queryParams.get('type');
  
  let initialType = 'Drive';
  if (typeParam === 'business') initialType = 'Business';
  if (typeParam === 'stay') initialType = 'Stay';

  return (
    // The page opens light and the enquiry runs dark beneath it, so the form
    // is a distinct plane rather than a continuation of the page it sits on.
    <div className="w-full">
      {/* Location summary strip */}
      <Section
        surface="light"
        rhythm="none"
        className="pt-[100px] pb-14"
        innerClassName="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
      >
        <div>
          <span className="text-[0.68rem] tracking-ultra uppercase ink-faint block mb-2">
            ESTATE LOCATION
          </span>
          <h1 className="font-serif text-[clamp(2.2rem,4vw,3.8rem)] font-light leading-[1] mb-4">
            Getting to Marque <span className="accent">One</span>
          </h1>
          <p className="font-sans text-[0.9rem] font-light ink-muted leading-relaxed max-w-measure-sm">
            {LOCATION.body[0]} {LOCATION.body[1]}
          </p>
        </div>

        <div className="rounded-sm overflow-hidden border rule">
          <ImageSlot
            src={IMAGES.locationMap.src}
            alt={IMAGES.locationMap.alt}
            aspect="16/9"
            placeholderLabel={IMAGES.locationMap.placeholder}
            className="w-full"
          />
        </div>
      </Section>

      {/* Expanded Enquiry Form */}
      <Enquiry initialType={initialType} />
    </div>
  );
}
