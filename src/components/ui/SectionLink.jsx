import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { isModifiedClick, scrollToId, splitTarget } from '../../lib/anchors';

/**
 * A link to a section of a page.
 *
 * Renders a real anchor with the real target, so the status bar, ctrl-click
 * and middle-click all behave. A plain left click is handled here instead:
 * already on the page, it scrolls; on another page, it navigates and carries
 * the section along in the location state. Either way the fragment never
 * reaches the address bar. See lib/anchors for why.
 *
 * Composes rather than replaces any `onClick` it is handed, because Base UI
 * passes its own down through `render` (closing the panel, for one) and the
 * whole menu would stay open if that were dropped on the floor.
 */
const SectionLink = React.forwardRef(function SectionLink({ to, onClick, ...props }, ref) {
  const navigate = useNavigate();
  const { pathname: here } = useLocation();
  const { pathname: target, id } = splitTarget(to);

  const handleClick = (event) => {
    onClick?.(event);
    if (!id || isModifiedClick(event)) return;

    event.preventDefault();
    if (target === here) {
      scrollToId(id);
    } else {
      navigate(target, { state: { scrollTo: id } });
    }
  };

  return <Link ref={ref} to={to} onClick={handleClick} {...props} />;
});

export default SectionLink;
