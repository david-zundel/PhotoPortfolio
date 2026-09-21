import { describe, expect, it } from "vitest";
import { getPreviewSrcSet, getPreviewUrl, getThumbUrl } from "@/lib/image-utils";
import { cloudinaryTransformUrl, isCloudinaryUrl } from "@/lib/cloudinary";

const CLD = "https://res.cloudinary.com/demo/image/upload/v1700000000/portfolio/abc123.jpg";
const SUPA = "https://xyz.supabase.co/storage/v1/object/public/photos/abc123.jpg";

describe("cloudinary url helpers", () => {
  it("detects cloudinary delivery urls", () => {
    expect(isCloudinaryUrl(CLD)).toBe(true);
    expect(isCloudinaryUrl(SUPA)).toBe(false);
    expect(isCloudinaryUrl("not a url")).toBe(false);
  });

  it("inserts a transformation segment after /image/upload/", () => {
    expect(cloudinaryTransformUrl(CLD, { width: 600, quality: 60 })).toBe(
      "https://res.cloudinary.com/demo/image/upload/c_limit,w_600,q_60,f_auto/v1700000000/portfolio/abc123.jpg"
    );
  });

  it("uses q_auto when no quality is given", () => {
    expect(cloudinaryTransformUrl(CLD, { width: 800 })).toContain("/c_limit,w_800,q_auto,f_auto/");
  });

  it("replaces an existing transformation instead of stacking", () => {
    const once = cloudinaryTransformUrl(CLD, { width: 600, quality: 60 });
    const twice = cloudinaryTransformUrl(once, { width: 1200, quality: 80 });
    expect(twice).toBe(
      "https://res.cloudinary.com/demo/image/upload/c_limit,w_1200,q_80,f_auto/v1700000000/portfolio/abc123.jpg"
    );
  });

  it("leaves non-cloudinary urls untouched", () => {
    expect(cloudinaryTransformUrl(SUPA, { width: 600 })).toBe(SUPA);
  });
});

describe("image-utils", () => {
  it("getPreviewUrl transforms cloudinary and passes through others", () => {
    expect(getPreviewUrl(CLD, 600, 60)).toContain("c_limit,w_600,q_60");
    expect(getPreviewUrl(SUPA, 600, 60)).toBe(SUPA);
  });

  it("getThumbUrl is a tiny low-quality variant", () => {
    expect(getThumbUrl(CLD)).toContain("w_60,q_20");
  });

  it("getPreviewSrcSet builds width descriptors for cloudinary only", () => {
    const set = getPreviewSrcSet(CLD, [360, 720], 74);
    expect(set).toBe(
      `${getPreviewUrl(CLD, 360, 74)} 360w, ${getPreviewUrl(CLD, 720, 74)} 720w`
    );
    expect(getPreviewSrcSet(SUPA, [360, 720], 74)).toBeUndefined();
    expect(getPreviewSrcSet(CLD, [], 74)).toBeUndefined();
  });
});
