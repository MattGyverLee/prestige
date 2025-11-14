/**
 * Sample EAF (ELAN Annotation Format) Files for Testing
 *
 * These are realistic EAF file contents for testing timeline parsing
 * without needing actual files on disk.
 */

export interface EAFSample {
  name: string;
  description: string;
  content: string;
  expectedMilestones: number;
  hasCarefulMerged: boolean;
  hasTranslationMerged: boolean;
}

/**
 * Minimal valid EAF file with 2 annotations
 */
export const minimalEAF: EAFSample = {
  name: "minimal.eaf",
  description: "Minimal valid EAF with 2 annotations, no audio tracks",
  expectedMilestones: 2,
  hasCarefulMerged: false,
  hasTranslationMerged: false,
  content: `<?xml version="1.0" encoding="UTF-8"?>
<ANNOTATION_DOCUMENT AUTHOR="Test" DATE="2024-01-01T00:00:00Z" FORMAT="3.0" VERSION="3.0">
  <HEADER MEDIA_FILE="" TIME_UNITS="milliseconds">
    <MEDIA_DESCRIPTOR MEDIA_URL="file:///test/video.mp4" MIME_TYPE="video/mp4" RELATIVE_MEDIA_URL="./video.mp4"/>
    <MEDIA_DESCRIPTOR MEDIA_URL="file:///test/audio.wav" MIME_TYPE="audio/wav" RELATIVE_MEDIA_URL="./audio.wav"/>
  </HEADER>
  <TIME_ORDER>
    <TIME_SLOT TIME_SLOT_ID="ts1" TIME_VALUE="0"/>
    <TIME_SLOT TIME_SLOT_ID="ts2" TIME_VALUE="3000"/>
    <TIME_SLOT TIME_SLOT_ID="ts3" TIME_VALUE="3000"/>
    <TIME_SLOT TIME_SLOT_ID="ts4" TIME_VALUE="6000"/>
  </TIME_ORDER>
  <TIER LINGUISTIC_TYPE_REF="default-lt" TIER_ID="default">
    <ANNOTATION>
      <ALIGNABLE_ANNOTATION ANNOTATION_ID="a1" TIME_SLOT_REF1="ts1" TIME_SLOT_REF2="ts2">
        <ANNOTATION_VALUE>First annotation</ANNOTATION_VALUE>
      </ALIGNABLE_ANNOTATION>
    </ANNOTATION>
    <ANNOTATION>
      <ALIGNABLE_ANNOTATION ANNOTATION_ID="a2" TIME_SLOT_REF1="ts3" TIME_SLOT_REF2="ts4">
        <ANNOTATION_VALUE>Second annotation</ANNOTATION_VALUE>
      </ALIGNABLE_ANNOTATION>
    </ANNOTATION>
  </TIER>
  <LINGUISTIC_TYPE GRAPHIC_REFERENCES="false" LINGUISTIC_TYPE_ID="default-lt" TIME_ALIGNABLE="true"/>
</ANNOTATION_DOCUMENT>`,
};

/**
 * EAF file with multilingual audio tracks (CarefulMerged and TranslationMerged)
 */
export const multilingualEAF: EAFSample = {
  name: "multilingual.eaf",
  description:
    "EAF with French 'Careful' and English 'Translation' audio tracks",
  expectedMilestones: 3,
  hasCarefulMerged: true,
  hasTranslationMerged: true,
  content: `<?xml version="1.0" encoding="UTF-8"?>
<ANNOTATION_DOCUMENT AUTHOR="Linguist" DATE="2024-01-15T10:30:00Z" FORMAT="3.0" VERSION="3.0">
  <HEADER MEDIA_FILE="" TIME_UNITS="milliseconds">
    <MEDIA_DESCRIPTOR MEDIA_URL="file:///test/original-video.mp4" MIME_TYPE="video/mp4" RELATIVE_MEDIA_URL="./original-video.mp4"/>
    <MEDIA_DESCRIPTOR MEDIA_URL="file:///test/original-audio.wav" MIME_TYPE="audio/wav" RELATIVE_MEDIA_URL="./original-audio.wav"/>
    <PROPERTY NAME="lastUsedAnnotationId">3</PROPERTY>
  </HEADER>
  <TIME_ORDER>
    <TIME_SLOT TIME_SLOT_ID="ts1" TIME_VALUE="0"/>
    <TIME_SLOT TIME_SLOT_ID="ts2" TIME_VALUE="2500"/>
    <TIME_SLOT TIME_SLOT_ID="ts3" TIME_VALUE="2500"/>
    <TIME_SLOT TIME_SLOT_ID="ts4" TIME_VALUE="5000"/>
    <TIME_SLOT TIME_SLOT_ID="ts5" TIME_VALUE="5000"/>
    <TIME_SLOT TIME_SLOT_ID="ts6" TIME_VALUE="8000"/>
  </TIME_ORDER>
  <TIER LINGUISTIC_TYPE_REF="default-lt" TIER_ID="default">
    <ANNOTATION>
      <ALIGNABLE_ANNOTATION ANNOTATION_ID="a1" TIME_SLOT_REF1="ts1" TIME_SLOT_REF2="ts2">
        <ANNOTATION_VALUE>Bonjour</ANNOTATION_VALUE>
      </ALIGNABLE_ANNOTATION>
    </ANNOTATION>
    <ANNOTATION>
      <ALIGNABLE_ANNOTATION ANNOTATION_ID="a2" TIME_SLOT_REF1="ts3" TIME_SLOT_REF2="ts4">
        <ANNOTATION_VALUE>Comment allez-vous?</ANNOTATION_VALUE>
      </ALIGNABLE_ANNOTATION>
    </ANNOTATION>
    <ANNOTATION>
      <ALIGNABLE_ANNOTATION ANNOTATION_ID="a3" TIME_SLOT_REF1="ts5" TIME_SLOT_REF2="ts6">
        <ANNOTATION_VALUE>Très bien, merci</ANNOTATION_VALUE>
      </ALIGNABLE_ANNOTATION>
    </ANNOTATION>
  </TIER>
  <TIER ANNOTATOR="voice-actor-fr" LINGUISTIC_TYPE_REF="audio-lt" TIER_ID="CarefulMerged">
    <ANNOTATION>
      <REF_ANNOTATION ANNOTATION_ID="a1_careful" ANNOTATION_REF="a1">
        <ANNOTATION_VALUE>AUDIO[original-video_Annotations/Careful_Merged.mp3, 0.0, 2.3]</ANNOTATION_VALUE>
      </REF_ANNOTATION>
    </ANNOTATION>
    <ANNOTATION>
      <REF_ANNOTATION ANNOTATION_ID="a2_careful" ANNOTATION_REF="a2">
        <ANNOTATION_VALUE>AUDIO[original-video_Annotations/Careful_Merged.mp3, 2.3, 4.8]</ANNOTATION_VALUE>
      </REF_ANNOTATION>
    </ANNOTATION>
    <ANNOTATION>
      <REF_ANNOTATION ANNOTATION_ID="a3_careful" ANNOTATION_REF="a3">
        <ANNOTATION_VALUE>AUDIO[original-video_Annotations/Careful_Merged.mp3, 4.8, 7.5]</ANNOTATION_VALUE>
      </REF_ANNOTATION>
    </ANNOTATION>
  </TIER>
  <TIER ANNOTATOR="translator-en" LINGUISTIC_TYPE_REF="audio-lt" TIER_ID="TranslationMerged">
    <ANNOTATION>
      <REF_ANNOTATION ANNOTATION_ID="a1_transl" ANNOTATION_REF="a1">
        <ANNOTATION_VALUE>AUDIO[original-video_Annotations/Translation_Merged.mp3, 0.0, 2.0]</ANNOTATION_VALUE>
      </REF_ANNOTATION>
    </ANNOTATION>
    <ANNOTATION>
      <REF_ANNOTATION ANNOTATION_ID="a2_transl" ANNOTATION_REF="a2">
        <ANNOTATION_VALUE>AUDIO[original-video_Annotations/Translation_Merged.mp3, 2.0, 4.5]</ANNOTATION_VALUE>
      </REF_ANNOTATION>
    </ANNOTATION>
    <ANNOTATION>
      <REF_ANNOTATION ANNOTATION_ID="a3_transl" ANNOTATION_REF="a3">
        <ANNOTATION_VALUE>AUDIO[original-video_Annotations/Translation_Merged.mp3, 4.5, 7.0]</ANNOTATION_VALUE>
      </REF_ANNOTATION>
    </ANNOTATION>
  </TIER>
  <LINGUISTIC_TYPE GRAPHIC_REFERENCES="false" LINGUISTIC_TYPE_ID="default-lt" TIME_ALIGNABLE="true"/>
  <LINGUISTIC_TYPE GRAPHIC_REFERENCES="false" LINGUISTIC_TYPE_ID="audio-lt" TIME_ALIGNABLE="false"/>
  <LOCALE LANGUAGE_CODE="fr" COUNTRY_CODE="FR"/>
  <LOCALE LANGUAGE_CODE="en" COUNTRY_CODE="US"/>
</ANNOTATION_DOCUMENT>`,
};

/**
 * EAF file with long content (stress test)
 */
export const longEAF: EAFSample = {
  name: "long-document.eaf",
  description: "Long EAF file with 20 annotations for stress testing",
  expectedMilestones: 20,
  hasCarefulMerged: false,
  hasTranslationMerged: false,
  content: generateLongEAF(20),
};

/**
 * Corrupt/Invalid EAF file for error handling tests
 */
export const corruptEAF: EAFSample = {
  name: "corrupt.eaf",
  description: "Invalid XML structure for error handling",
  expectedMilestones: 0,
  hasCarefulMerged: false,
  hasTranslationMerged: false,
  content: `<?xml version="1.0" encoding="UTF-8"?>
<ANNOTATION_DOCUMENT>
  <UNCLOSED_TAG>
  <TIME_SLOT TIME_SLOT_ID="ts1" TIME_VALUE="0"/>
  <!-- Missing closing tags, invalid structure -->
`,
};

/**
 * EAF with overlapping time slots (edge case)
 */
export const overlappingEAF: EAFSample = {
  name: "overlapping.eaf",
  description: "EAF with overlapping annotations (edge case)",
  expectedMilestones: 3,
  hasCarefulMerged: false,
  hasTranslationMerged: false,
  content: `<?xml version="1.0" encoding="UTF-8"?>
<ANNOTATION_DOCUMENT AUTHOR="Test" DATE="2024-01-01T00:00:00Z" FORMAT="3.0" VERSION="3.0">
  <HEADER MEDIA_FILE="" TIME_UNITS="milliseconds">
    <MEDIA_DESCRIPTOR MEDIA_URL="file:///test/video.mp4" MIME_TYPE="video/mp4"/>
  </HEADER>
  <TIME_ORDER>
    <TIME_SLOT TIME_SLOT_ID="ts1" TIME_VALUE="0"/>
    <TIME_SLOT TIME_SLOT_ID="ts2" TIME_VALUE="5000"/>
    <TIME_SLOT TIME_SLOT_ID="ts3" TIME_VALUE="3000"/>
    <TIME_SLOT TIME_SLOT_ID="ts4" TIME_VALUE="7000"/>
    <TIME_SLOT TIME_SLOT_ID="ts5" TIME_VALUE="6000"/>
    <TIME_SLOT TIME_SLOT_ID="ts6" TIME_VALUE="10000"/>
  </TIME_ORDER>
  <TIER LINGUISTIC_TYPE_REF="default-lt" TIER_ID="default">
    <ANNOTATION>
      <ALIGNABLE_ANNOTATION ANNOTATION_ID="a1" TIME_SLOT_REF1="ts1" TIME_SLOT_REF2="ts2">
        <ANNOTATION_VALUE>First (0-5s)</ANNOTATION_VALUE>
      </ALIGNABLE_ANNOTATION>
    </ANNOTATION>
    <ANNOTATION>
      <ALIGNABLE_ANNOTATION ANNOTATION_ID="a2" TIME_SLOT_REF1="ts3" TIME_SLOT_REF2="ts4">
        <ANNOTATION_VALUE>Second (3-7s) - overlaps first</ANNOTATION_VALUE>
      </ALIGNABLE_ANNOTATION>
    </ANNOTATION>
    <ANNOTATION>
      <ALIGNABLE_ANNOTATION ANNOTATION_ID="a3" TIME_SLOT_REF1="ts5" TIME_SLOT_REF2="ts6">
        <ANNOTATION_VALUE>Third (6-10s) - overlaps second</ANNOTATION_VALUE>
      </ALIGNABLE_ANNOTATION>
    </ANNOTATION>
  </TIER>
  <LINGUISTIC_TYPE GRAPHIC_REFERENCES="false" LINGUISTIC_TYPE_ID="default-lt" TIME_ALIGNABLE="true"/>
</ANNOTATION_DOCUMENT>`,
};

/**
 * Helper function to generate long EAF content
 */
function generateLongEAF(numAnnotations: number): string {
  let timeSlots = "";
  let annotations = "";

  for (let i = 0; i < numAnnotations; i++) {
    const startMs = i * 1000;
    const endMs = (i + 1) * 1000;

    timeSlots += `
    <TIME_SLOT TIME_SLOT_ID="ts${i * 2 + 1}" TIME_VALUE="${startMs}"/>
    <TIME_SLOT TIME_SLOT_ID="ts${i * 2 + 2}" TIME_VALUE="${endMs}"/>`;

    annotations += `
    <ANNOTATION>
      <ALIGNABLE_ANNOTATION ANNOTATION_ID="a${i + 1}" TIME_SLOT_REF1="ts${i * 2 + 1}" TIME_SLOT_REF2="ts${i * 2 + 2}">
        <ANNOTATION_VALUE>Annotation ${i + 1}</ANNOTATION_VALUE>
      </ALIGNABLE_ANNOTATION>
    </ANNOTATION>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<ANNOTATION_DOCUMENT AUTHOR="Test" DATE="2024-01-01T00:00:00Z" FORMAT="3.0" VERSION="3.0">
  <HEADER MEDIA_FILE="" TIME_UNITS="milliseconds">
    <MEDIA_DESCRIPTOR MEDIA_URL="file:///test/video.mp4" MIME_TYPE="video/mp4"/>
    <MEDIA_DESCRIPTOR MEDIA_URL="file:///test/audio.wav" MIME_TYPE="audio/wav"/>
  </HEADER>
  <TIME_ORDER>${timeSlots}
  </TIME_ORDER>
  <TIER LINGUISTIC_TYPE_REF="default-lt" TIER_ID="default">${annotations}
  </TIER>
  <LINGUISTIC_TYPE GRAPHIC_REFERENCES="false" LINGUISTIC_TYPE_ID="default-lt" TIME_ALIGNABLE="true"/>
</ANNOTATION_DOCUMENT>`;
}

/**
 * All sample EAF files for easy access
 */
export const allEAFSamples = {
  minimal: minimalEAF,
  multilingual: multilingualEAF,
  long: longEAF,
  corrupt: corruptEAF,
  overlapping: overlappingEAF,
};
