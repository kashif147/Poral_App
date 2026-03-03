import React from 'react';
import RegistrationPaymentModal from '../payment/RegistrationPaymentModal';

const EventPaymentModal = ({
  visible,
  onClose,
  onSuccess,
  event,
  selectedDays = [],
}) => {
  const totalAmount = (selectedDays || []).reduce(
    (sum, d) => sum + (d.price || 0),
    0,
  );

  const daySummary =
    selectedDays?.length > 1
      ? `Day ${selectedDays.map((d, i) => i + 1).join(' & Day ')} Access`
      : selectedDays?.[0]?.title || 'Event Access';

  const metadata = {
    eventId: event?.id,
    eventTitle: event?.title,
    selectedDayIds: (selectedDays || []).map((d) => d.id).join(','),
  };

  return (
    <RegistrationPaymentModal
      visible={visible}
      onClose={onClose}
      onSuccess={onSuccess}
      item={event}
      amount={totalAmount}
      summaryLabel={daySummary}
      context="event"
      purpose="eventRegistration"
      metadata={metadata}
      primaryActionLabel="Register & Pay"
    />
  );
};

export default EventPaymentModal;

