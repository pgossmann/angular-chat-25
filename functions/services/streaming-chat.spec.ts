import { TestBed } from '@angular/core/testing';

import { StreamingChat } from './streaming-chat';

describe('StreamingChat', () => {
  let service: StreamingChat;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StreamingChat);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
