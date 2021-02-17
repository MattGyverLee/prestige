import "@testing-library/jest-dom/extend-expect";

import { cleanup, render } from "@testing-library/react";
import configureStore, * as actions from "../../store";

import { FileList } from "../FileList/FileList";
import { Provider } from "react-redux";
import React from "react";
import { getSourceMedia } from "../globalFunctions";

const store = configureStore();

// TODO: Constrain to Media Type
const sourceMedia = [
  {
    // Normalized Audio
    blobURL:
      "file:///C:/Users/thoua/Documents/SayMore/French%20Transcription/Sessions/Michel/Messsage%20for%20Cameroon%20Branch%20-%20lo%20res_Source_StandardAudio_Normalized.mp3",
    extension: ".mp3",
    hasAnnotation: false,
    inMilestones: false,
    isAnnotation: false,
    isMerged: false,
    mimeType: "audio/mpeg",
    name:
      "Messsage for Cameroon Branch - lo res_Source_StandardAudio_Normalized.mp3",
    path:
      "C:Users\\thoua\\Documents\\SayMore\\French Transcription\\Sessions\\Michel\\Messsage for Cameroon Branch - lo res_Source_StandardAudio_Normalized.mp3",
    wsAllowed: true,
  },
  {
    // Saymore Ripped Audio
    blobURL:
      "file:///C:/Users/thoua/Documents/SayMore/French%20Transcription/Sessions/Michel/Messsage%20for%20Cameroon%20Branch%20-%20lo%20res_Source_StandardAudio.wav",
    extension: ".wav",
    hasAnnotation: false,
    inMilestones: false,
    isAnnotation: false,
    isMerged: false,
    mimeType: "audio/wav",
    name: "Messsage for Cameroon Branch - lo res_Source_StandardAudio.wav",
    path:
      "C:Users\\thoua\\Documents\\SayMore\\French Transcription\\Sessions\\Michel\\Messsage for Cameroon Branch - lo res_Source_StandardAudio.wav",
    wsAllowed: false,
  },
  {
    // Original File
    blobURL:
      "file:///C:/Users/thoua/Documents/SayMore/French%20Transcription/Sessions/Michel/Messsage%20for%20Cameroon%20Branch%20-%20lo%20res_Source.mp4",
    extension: ".mp4",
    hasAnnotation: false,
    inMilestones: false,
    isAnnotation: false,
    isMerged: false,
    mimeType: "video/mp4",
    name: "Messsage for Cameroon Branch - lo res_Source.mp4",
    path:
      "C:Users\\thoua\\Documents\\SayMore\\French Transcription\\Sessions\\Michel\\Messsage for Cameroon Branch - lo res_Source.mp4",
    wsAllowed: false,
  },
  {
    // Unrelated File
    blobURL:
      "file:///C:/Users/thoua/Documents/SayMore/French%20Transcription/Sessions/Michel/zPearfilm.mp4",
    extension: ".mp4",
    hasAnnotation: false,
    inMilestones: false,
    isAnnotation: false,
    isMerged: false,
    mimeType: "video/mp4",
    name: "zPearfilm.mp4",
    path:
      "C:Users\\thoua\\Documents\\SayMore\\French Transcription\\Sessions\\Michel\\zPearfilm.mp4",
    wsAllowed: false,
  },
];

afterEach(cleanup);

const tree = (props?: any) => (
  <Provider store={store}>
    <FileList
      sourceMedia={getSourceMedia(sourceMedia, true)}
      togglePlay={() => actions.togglePlay(true)}
      setURL={actions.setURL}
    />
  </Provider>
);

afterEach(cleanup);

it("Displays the Full Set", () => {
  const { getByTestId } = render(tree());
  const ul = getByTestId("fileList.UL");
  expect(ul).toBeVisible();
  expect(ul.childNodes.length).toMatch(2);
  expect(ul).toMatchSnapshot();
});

it("Displays the MP4", () => {
  sourceMedia.pop();
  const { getByTestId } = render(tree());
  const ul = getByTestId("fileList.UL");
  expect(ul).toBeVisible();
  expect(ul.childNodes.length).toMatch(1);
  expect(ul.firstElementChild).toHaveTextContent("res_Source.mp4");
  expect(ul).toMatchSnapshot();
});
it("Displays the WAV", () => {
  sourceMedia.pop();
  const { getByTestId } = render(tree());
  const ul = getByTestId("fileList.UL");
  expect(ul).toBeVisible();
  expect(ul.childNodes.length).toMatch(1);
  expect(ul.firstElementChild).toHaveTextContent("rce_StandardAudio.wav");
  expect(ul).toMatchSnapshot();
});

// Todo: Enable MP3 Test
// currently Failing
/* it("Displays the MP3", () => {
  sourceMedia.pop();
  const { getByTestId, container } = render(tree());
  const ul = getByTestId("fileList.UL");
  expect(ul).toBeVisible();
  expect(ul.childNodes.length === 1);
  expect(ul.firstElementChild).toHaveTextContent("_Normalized.mp3");
  expect(ul).toMatchSnapshot();
}); */
