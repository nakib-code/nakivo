export interface HeroBanner {
  _id: string;
  title: string;
  subtitle: string;
  description: string;

  buttonText: string;
  buttonLink: string;

  offerText?: string;

  image: string;
  mobileImage?: string;

  active: boolean;
  order: number;
}