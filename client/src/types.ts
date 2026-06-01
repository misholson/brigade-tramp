export type Part = 'Tenor' | 'Lead' | 'Baritone' | 'Bass';
export type SingerStatus = 'Active' | 'Inactive' | 'Optional';

export interface SingerDto {
  id: number;
  badgeName: string;
  firstName: string;
  lastName: string;
  part: Part;
  code: string;
  email: string;
  status: SingerStatus;
}

export interface SingerDetailDto {
  singer: SingerDto;
  allSingers: SingerDto[];
  sungWithIds: number[];
  allowBusyBee: boolean;
  sungWithTwiceIds: number[];
}

export interface EventWithSingersDto {
  id: number;
  name: string;
  date: string;
  endDate: string | null;
  allowBusyBee: boolean;
  emailFooter: string;
  singers: SingerDto[];
}

export interface MyEventDto {
  eventId: number;
  eventName: string;
  date: string;
  endDate: string | null;
  singerCode: string;
}

export interface EventUserRoleItemDto {
  userId: number;
  email: string;
  name: string;
  role: string;
}
