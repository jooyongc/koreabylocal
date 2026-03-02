interface KakaoShareButton {
  objectType: "feed";
  content: {
    title: string;
    description: string;
    imageUrl: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  };
  buttons?: {
    title: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  }[];
}

interface KakaoSDK {
  init: (appKey: string) => void;
  isInitialized: () => boolean;
  Share: {
    sendDefault: (settings: KakaoShareButton) => void;
  };
}

interface Window {
  Kakao?: KakaoSDK;
}
