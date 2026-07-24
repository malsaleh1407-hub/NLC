import React from 'react';
import {Composition} from 'remotion';
import {YouTubeCommercial} from './compositions/YouTubeCommercial';
import {InstagramReel} from './compositions/InstagramReel';
import {InstagramPost} from './compositions/InstagramPost';
import {LinkedInPost} from './compositions/LinkedInPost';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 30s cinematic brand commercial — the hero piece */}
      <Composition
        id="YouTubeCommercial"
        component={YouTubeCommercial}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
      {/* 15s vertical reel — hook-first cutdown */}
      <Composition
        id="InstagramReel"
        component={InstagramReel}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* 12s seamless-loop square post */}
      <Composition
        id="InstagramPost"
        component={InstagramPost}
        durationInFrames={360}
        fps={30}
        width={1080}
        height={1080}
      />
      {/* 20s B2B feed video */}
      <Composition
        id="LinkedInPost"
        component={LinkedInPost}
        durationInFrames={600}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
