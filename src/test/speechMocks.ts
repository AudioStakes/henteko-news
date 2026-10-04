export class MockSpeechSynthesisUtterance extends EventTarget implements SpeechSynthesisUtterance {
  lang = "";
  pitch = 1;
  rate = 1;
  volume = 1;
  voice: SpeechSynthesisVoice | null = null;
  text: string;
  onboundary: SpeechSynthesisUtterance["onboundary"] = null;
  onend: SpeechSynthesisUtterance["onend"] = null;
  onerror: SpeechSynthesisUtterance["onerror"] = null;
  onmark: SpeechSynthesisUtterance["onmark"] = null;
  onpause: SpeechSynthesisUtterance["onpause"] = null;
  onresume: SpeechSynthesisUtterance["onresume"] = null;
  onstart: SpeechSynthesisUtterance["onstart"] = null;

  constructor(text = "") {
    super();
    this.text = text;
  }
}

export class MockSpeechSynthesisEvent extends Event implements SpeechSynthesisEvent {
  readonly charIndex = 0;
  readonly charLength = 0;
  readonly elapsedTime = 0;
  readonly name = "";
  readonly utterance: SpeechSynthesisUtterance;

  constructor(type: string, utterance: SpeechSynthesisUtterance) {
    super(type);
    this.utterance = utterance;
  }
}

export class MockSpeechSynthesisErrorEvent
  extends MockSpeechSynthesisEvent
  implements SpeechSynthesisErrorEvent
{
  readonly error: SpeechSynthesisErrorCode = "synthesis-failed";
}
