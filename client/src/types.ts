export type Part = 'Tenor' | 'Lead' | 'Baritone' | 'Bass';
export type DanceCardStatus = 'Required' | 'Optional' | 'Hidden';
export type ContestStatus = 'Included' | 'Once' | 'None';

export interface SingerDto {
  id: number;
  badgeName: string;
  firstName: string;
  lastName: string;
  part: Part;
  code: string;
  email: string;
  danceCardStatus: DanceCardStatus;
  contestStatus: ContestStatus;
}

export interface SingerDetailDto {
  singer: SingerDto;
  allSingers: SingerDto[];
  sungWithIds: number[];
  allowBusyBee: boolean;
  sungWithTwiceIds: number[];
  eventId: number;
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
