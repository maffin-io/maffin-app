import type { User } from '@/types/user';
import { isDemo } from '@/helpers/env';

const emptyUser: User = {
  name: '',
  email: '',
  image: '',
  isLoggedIn: false,
};

export default async function getUser(): Promise<User> {
  if (isDemo()) {
    return {
      name: 'Maffin',
      email: 'iomaffin@gmail.com',
      image: '',
      isLoggedIn: true,
    };
  }

  try {
    const res = await window.gapi.client.people.people.get({
      resourceName: 'people/me',
      personFields: 'names,emailAddresses,photos',
    });

    return {
      name: res.result.names?.[0].displayName as string,
      email: res.result.emailAddresses?.[0].value as string,
      image: res.result.photos?.[0].url as string,
      isLoggedIn: true,
    };
  } catch {
    return emptyUser;
  }
}
