export type RoadTripMap = {
  title: string;
  embedSrc: string;
  openInMapsHref: string;
};

/** Google Maps embed + directions link per road-trip guide slug. */
export const ROAD_TRIP_MAPS: Record<string, RoadTripMap> = {
  "pacific-coast-highway-road-trip-7-days": {
    title: "Pacific Coast Highway — 7-day overview map",
    embedSrc:
      "https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d10343438!2d-122.4194!3d37.7749!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e0!4m5!1s0x80859a6d006900bc%3A0x4cfd501106f5c5!2sSan%20Francisco%2C%20CA!3m2!1d37.7749295!2d-122.4194155!4m5!1s0x80c2c75ddc27da13%3A0xe22fdf6f254608f4!2sLos%20Angeles%2C%20CA!3m2!1d34.0549076!2d-118.242643!5e0!3m2!1sen!2sus!4v1710000000000",
    openInMapsHref:
      "https://www.google.com/maps/dir/San+Francisco,+CA/Monterey,+CA/San+Simeon,+CA/Santa+Barbara,+CA/Los+Angeles,+CA",
  },
  "grand-canyon-las-vegas-road-trip-route": {
    title: "Grand Canyon → Las Vegas — 10-day loop",
    embedSrc:
      "https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d2147483647!2d-112.1401!3d36.0544!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e0!4m5!1s0x80ccab93bcd2f4c3%3A0x8b0d0c7e5e5e5e5e!2sGrand+Canyon+Village,+AZ!3m2!1d36.0544445!2d-112.1401103!4m5!1s0x80beb782a4f57dd9%3A0x3accd9032de3fb1f!2sLas+Vegas,+NV!3m2!1d36.171563!2d-115.1391009!5e0!3m2!1sen!2sus!4v1710000000000",
    openInMapsHref:
      "https://www.google.com/maps/dir/Las+Vegas,+NV/Grand+Canyon+National+Park,+AZ/Page,+AZ/Zion+National+Park,+UT/Las+Vegas,+NV",
  },
  "west-coast-road-trip-san-francisco-los-angeles": {
    title: "San Francisco to Los Angeles — coastal & inland options",
    embedSrc:
      "https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d10343438!2d-122.4194!3d37.7749!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e0!4m5!1s0x80859a6d006900bc%3A0x4cfd501106f5c5!2sSan+Francisco%2C%20CA!3m2!1d37.7749295!2d-122.4194155!4m5!1s0x80c2c75ddc27da13%3A0xe22fdf6f254608f4!2sLos%20Angeles%2C%20CA!3m2!1d34.0549076!2d-118.242643!5e0!3m2!1sen!2sus!4v1710000000000",
    openInMapsHref:
      "https://www.google.com/maps/dir/San+Francisco,+CA/Monterey,+CA/Morro+Bay,+CA/Santa+Barbara,+CA/Malibu,+CA/Los+Angeles,+CA",
  },
  "east-coast-road-trip-nyc-to-miami": {
    title: "NYC to Miami — East Coast corridor",
    embedSrc:
      "https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d193782!2d-74.006!3d40.7128!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e0!4m5!1s0x89c24fa5d33f083b%3A0xc80b8fa06e177792!2sNew+York,+NY!3m2!1d40.7127753!2d-74.0059728!4m5!1s0x88d9b6823b879e3f%3A0x8b0d0c7e5e5e5e5e!2sMiami,+FL!3m2!1d25.7616798!2d-80.1917902!5e0!3m2!1sen!2sus!4v1710000000000",
    openInMapsHref:
      "https://www.google.com/maps/dir/New+York,+NY/Philadelphia,+PA/Washington,+DC/Charleston,+SC/Savannah,+GA/Miami,+FL",
  },
  "southwest-road-trip-denver-grand-canyon-phoenix": {
    title: "Denver → Grand Canyon → Phoenix — Southwest loop",
    embedSrc:
      "https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d2147483647!2d-104.9903!3d39.7392!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e0!4m5!1s0x876b80b54e23f17f%3A0x6a5c8c8c8c8c8c8c!2sDenver,+CO!3m2!1d39.7392358!2d-104.990251!4m5!1s0x80ccab93bcd2f4c3%3A0x8b0d0c7e5e5e5e5e!2sGrand+Canyon+Village,+AZ!3m2!1d36.0544445!2d-112.1401103!5e0!3m2!1sen!2sus!4v1710000000000",
    openInMapsHref:
      "https://www.google.com/maps/dir/Denver,+CO/Moab,+UT/Monument+Valley,+AZ/Grand+Canyon+National+Park,+AZ/Phoenix,+AZ",
  },
};
