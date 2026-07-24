import React from 'react';
import {Composition} from 'remotion';
import {YouTubeCommercial} from './compositions/YouTubeCommercial';
import {InstagramReel} from './compositions/InstagramReel';
import {InstagramPost} from './compositions/InstagramPost';
import {LinkedInPost} from './compositions/LinkedInPost';
import {ArabicReel} from './compositions/ArabicReel';
import {SaudiProjectMap} from './compositions/SaudiProjectMap';
import {ProductSpot, productSpotDefaults} from './compositions/ProductSpot';

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
      {/* 15s Arabic RTL vertical reel (Cairo typeface) */}
      <Composition
        id="ArabicReel"
        component={ArabicReel}
        durationInFrames={470}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* 18s geographic proof film — the Kingdom lights up city by city */}
      <Composition
        id="SaudiProjectMap"
        component={SaudiProjectMap}
        durationInFrames={540}
        fps={30}
        width={1920}
        height={1080}
      />
      {/* 8s per-product spot (4:5) — render one per catalogue product */}
      <Composition
        id="ProductSpot"
        component={ProductSpot}
        durationInFrames={240}
        fps={30}
        width={1080}
        height={1350}
        defaultProps={productSpotDefaults}
      />
    </>
  );
};
