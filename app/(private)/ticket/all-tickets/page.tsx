import React from 'react';
import Tickets from './components/list';

interface PageProps {
  featureTitle?: string;
}

const Page: React.FC<PageProps> = () => {
  return <Tickets />;
};

export default Page;