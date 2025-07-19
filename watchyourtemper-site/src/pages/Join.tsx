import { useEffect } from 'react';

const Join: React.FC = () => {
  useEffect(() => {
    window.location.href = 'https://dashboard.mailerlite.com/forms/1434970/150992102536250799/share';
  }, []);

  return null;
};

export default Join;