import type { User } from '@/types/user';

const emptyUser: User = {
  name: '',
  email: '',
  image: '',
  isLoggedIn: false,
};

export default async function getUser(): Promise<User> {
  if (process.env.NEXT_PUBLIC_ENV === 'demo') {
    return {
      name: 'Maffin',
      email: 'iomaffin@gmail.com',
      image: 'https://app.maffin.io/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fmaffin_logo_sm.094266a4.png&w=128&q=75',
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
