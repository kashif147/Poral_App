import React from 'react';
import FullWidthContainImage from './FullWidthContainImage';
import { getEventImageUrl } from '../helpers/events.helper';

/**
 * Clean event/course image only — title/date/location render in the card body
 * because promotional images already include those details.
 */
export const EventCourseCardHeader = ({ item }) => {
  const uri =
    getEventImageUrl(item) ||
    getEventImageUrl(item?.raw) ||
    getEventImageUrl(item?.event) ||
    getEventImageUrl(item?.course) ||
    '';

  if (!uri) {
    return null;
  }

  return <FullWidthContainImage uri={uri} />;
};

export const EVENT_COURSE_CARD_HEADER_HEIGHT = 200;
