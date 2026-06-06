jest.mock("@react-native-firebase/messaging", () => {
  const messaging = () => ({
    requestPermission: jest.fn().mockResolvedValue(true),
    onMessage: jest.fn(() => jest.fn()),
    setBackgroundMessageHandler: jest.fn(),
  });

  messaging.AuthorizationStatus = {};

  return messaging;
});

jest.mock("react-native-image-picker", () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));

jest.mock("react-native-geolocation-service", () => ({
  requestAuthorization: jest.fn().mockResolvedValue("granted"),
  getCurrentPosition: jest.fn(),
}));

jest.mock("react-native-maps", () => {
  const React = require("react");
  const { View } = require("react-native");

  const MockMapView = React.forwardRef((props, ref) => (
    <View ref={ref} {...props}>
      {props.children}
    </View>
  ));

  MockMapView.displayName = "MockMapView";

  return {
    __esModule: true,
    default: MockMapView,
    Marker: ({ children, ...props }) => <View {...props}>{children}</View>,
    Circle: (props) => <View {...props} />,
    PROVIDER_GOOGLE: "google",
  };
});

jest.mock("@react-native-community/slider", () => {
  const React = require("react");
  const { View } = require("react-native");
  return (props) => <View {...props} />;
});
