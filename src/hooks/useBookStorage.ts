import useGapiClient from '@/hooks/useGapiClient';
import BookStorage from '@/apis/BookStorage';

export default function useBookStorage(): [BookStorage | null] {
  const [isGapiLoaded] = useGapiClient();

  return [isGapiLoaded ? new BookStorage(window.gapi.client) : null];
}
