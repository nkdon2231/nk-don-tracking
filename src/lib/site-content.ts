export const PUBLIC_LINKS = [
  { href: "/services", label: "Services" },
  { href: "/solutions", label: "Solutions" },
  { href: "/quote", label: "Quote" },
  { href: "/about", label: "About" },
  { href: "/support", label: "Support" },
] as const;

export const FOOTER_LINKS = [
  { href: "/services", label: "Services" },
  { href: "/solutions", label: "Solutions" },
  { href: "/track", label: "Track a shipment" },
  { href: "/quote", label: "Get a quote" },
  { href: "/book", label: "Request a pickup" },
  { href: "/estimate", label: "Delivery window" },
  { href: "/support", label: "Support" },
  { href: "/support/tracking", label: "Tracking help" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const SUPPORT_TOPICS = [
  "Shipment support",
  "Tracking assistance",
  "Quote follow-up",
  "Pickup request follow-up",
  "Customs question",
  "Delivery question",
  "Other",
] as const;

export const SOLUTIONS = [
  {
    id: "courier",
    title: "Courier and last mile",
    summary: "Parcels, documents, and booked handovers that stay on one tracking number from collection to signature.",
    services: ["express_courier", "pickup_delivery", "secure_tracking"],
  },
  {
    id: "freight",
    title: "Freight and air",
    summary: "Heavier movements — road, air, and cross-border loads — recorded as events, not as a separate file.",
    services: ["international_freight", "air_cargo", "ground_transportation"],
  },
  {
    id: "control",
    title: "Storage, papers, and control",
    summary: "Warehouse holds, customs papers, and consignment control, published only when staff release them.",
    services: ["warehousing", "customs_documentation", "business_logistics", "consignment"],
  },
] as const;

export const SERVICES = [
  {
    value: "express_courier",
    label: "Express Courier",
    image: "/images/van.jpg",
    alt: "A courier van ready for a parcel collection",
    summary: "Time-boxed parcels and documents, collected and handed over on a booked window.",
    detail:
      "Express is for envelopes and parcels that move as courier, not as a container. The desk writes the collection, each hub the piece passes, and the final signature as separate events on one tracking number.",
    covers: ["Envelopes and parcels", "A booked pickup window", "Proof of handover, public only if staff release it"],
    suited: "When the shipment is small enough to ride as courier.",
  },
  {
    value: "international_freight",
    label: "International Freight",
    image: "/images/containers.jpg",
    alt: "Freight containers staged for an international move",
    summary: "Full and consolidated cross-border loads, kept as one file from origin facility to destination.",
    detail:
      "Freight does not lose its history when it reaches a border. Customs clearance is another event on the same record, and the commercial papers stay attached to that shipment instead of a separate inbox.",
    covers: ["Full and consolidated loads", "Origin and destination facilities", "Border clearance recorded on the timeline"],
    suited: "When the cargo is a freight movement, not a single courier envelope.",
  },
  {
    value: "air_cargo",
    label: "Air Cargo",
    image: "/images/aircargo.jpg",
    alt: "Air cargo prepared beside an aircraft",
    summary: "Time-critical freight accepted at the warehouse and built for the aircraft.",
    detail:
      "Air cargo is heavier and more controlled than a courier pouch. Piece count, weight, and the recovery at destination are stored on the shipment, so uplift is an event the customer can see without opening the internal file.",
    covers: ["Warehouse acceptance", "Uplift and destination recovery", "Piece count and weight on the same record"],
    suited: "Freight that must move by air and will not fit a courier service.",
  },
  {
    value: "ground_transportation",
    label: "Ground Transportation",
    image: "/images/hero.jpg",
    alt: "Road freight prepared for a ground leg",
    summary: "Truck legs between hubs, ports, airports, and the delivery point, on the shipment that already exists.",
    detail:
      "A road move is not a second, disconnected job. It is the next leg of the tracking number the customer already has, whether that leg is hub to hub or the run out of a port or airport.",
    covers: ["Hub-to-hub trucking", "Port and airport transfers", "Regional runs to the delivery point"],
    suited: "When the next physical move is by road.",
  },
  {
    value: "warehousing",
    label: "Warehousing",
    image: "/images/warehouse.jpg",
    alt: "Palletized goods inside a warehouse",
    summary: "Inbound, hold, sortation, and release against the instructions already on the consignment.",
    detail:
      "Storage is a stage, not a blank status. Staff record arrival at the facility, the hold, and the release. Photos of the goods can sit on the file and stay private until someone decides the customer should see them.",
    covers: ["Inbound receipt", "Hold and sortation", "Release against written instructions"],
    suited: "Cargo that must wait before the next leg.",
  },
  {
    value: "pickup_delivery",
    label: "Pickup & Delivery",
    image: "/images/handover.jpg",
    alt: "A handover at a loading point",
    summary: "The first collection and the last handover, with a window and a person who receives the goods.",
    detail:
      "These are the two moments a customer usually sees. The desk books the window, records who handed the goods over, and can publish the photo on the tracking page or keep it inside the private file.",
    covers: ["Booked collection windows", "Final-mile handover", "Proof that stays private until it is released"],
    suited: "When the job is to collect the goods or put them in someone’s hands.",
  },
  {
    value: "customs_documentation",
    label: "Customs & Documentation",
    image: "/images/documents.jpg",
    alt: "Shipping documents laid out for a consignment",
    summary: "Invoices, packing lists, and declarations filed on the shipment they belong to.",
    detail:
      "Papers are evidence, not a side conversation. The customer can be shown that clearance happened. Notes about a query, a hold, or a missing stamp stay on the desk unless staff mark a specific file public.",
    covers: ["Commercial invoices and packing lists", "Declarations attached to the shipment", "Clearance written as an event"],
    suited: "Cross-border cargo that cannot move on a tracking number alone.",
  },
  {
    value: "business_logistics",
    label: "Business Logistics",
    image: "/images/control.jpg",
    alt: "An operations desk reviewing a company movement",
    summary: "Repeat company movements, each dispatch with its own tracking number and your reference beside it.",
    detail:
      "A standing lane is not one endless shipment. Every dispatch gets a new record so the timeline, weight, and proof belong to that movement. Your reference is stored for the desk. The customer still tracks the tracking number.",
    covers: ["Recurring company lanes", "Your reference next to our number", "A separate file for each dispatch"],
    suited: "Companies that ship with QCORVAZENT more than once.",
  },
  {
    value: "consignment",
    label: "Consignment Management",
    image: "/images/containers.jpg",
    alt: "Grouped freight held as one consignment",
    summary: "Many pieces, one consignment: count, weight, events, and evidence stay on a single file.",
    detail:
      "Splitting a lot across unnamed records is how pieces go missing. A consignment keeps the package count on the shipment, and every scan after that refers to the same tracking number.",
    covers: ["Multi-piece consignments", "Package count and weight together", "One timeline for the whole lot"],
    suited: "When several packages must travel and be answered for as one consignment.",
  },
  {
    value: "secure_tracking",
    label: "Secure Shipment Tracking",
    image: "/images/documents.jpg",
    alt: "A tracking record prepared for the customer",
    summary: "The customer page for a live tracking number. Names, phone numbers, and internal notes are not on it.",
    detail:
      "Tracking is part of every booked movement. It can also be the service itself when the job is a controlled handoff and the customer only needs the published record: status, cities, events, and files staff have marked public.",
    covers: ["Lookup with NKD-YYYYMMDD-XXXX", "Public events only", "Evidence that stays private until released"],
    suited: "Anyone who was given a QCORVAZENT tracking number.",
  },
] as const;

export const STEPS = [
  {
    title: "A number is issued",
    copy: "Staff book the shipment and QCORVAZENT assigns NKD-YYYYMMDD-XXXX. That is the number the customer uses. A company reference is kept on the desk, not substituted for it.",
  },
  {
    title: "Movement is appended",
    copy: "Pickup, a road or air leg, customs, and delivery are new events. Older events stay on the timeline. Status is not a field someone types over.",
  },
  {
    title: "The public page stays narrow",
    copy: "Customers see status, cities, events, and files marked public. Names, addresses, internal notes, and private documents stay with staff.",
  },
] as const;

export const STATUS_HELP = [
  {
    status: "pickup_scheduled",
    label: "Pickup Scheduled",
    means: "Staff created the shipment and recorded that collection is still ahead.",
    next: "Use the window you were given. If that window has passed and the status has not changed, send the tracking number to support.",
  },
  {
    status: "picked_up",
    label: "Picked Up",
    means: "An event says the goods were collected.",
    next: "The next update is written when the shipment is processed or moves.",
  },
  {
    status: "processing",
    label: "Processing",
    means: "The shipment is in handling after collection, before the next movement event.",
    next: "No automatic scan is implied. If nothing new is recorded, contact support with the number.",
  },
  {
    status: "in_transit",
    label: "In Transit",
    means: "Staff recorded that the shipment is moving between points already on the file.",
    next: "The page does not show live GPS. A new event appears only when someone records it.",
  },
  {
    status: "arrived_at_facility",
    label: "Arrived at Facility",
    means: "An arrival at a named facility was recorded.",
    next: "The facility name is shown when staff attached one. A missing name means it was not published.",
  },
  {
    status: "customs_clearance",
    label: "Customs Clearance",
    means: "A clearance event was recorded on this shipment. It is not a government stamp or an approval by itself.",
    next: "Public customs files appear only if staff marked them public.",
  },
  {
    status: "out_for_delivery",
    label: "Out for Delivery",
    means: "Staff recorded that the shipment is on a delivery run.",
    next: "A courier name is shown only when one is assigned. The courier phone is not published.",
  },
  {
    status: "delivered",
    label: "Delivered",
    means: "A delivery event was recorded. A date is shown when staff stored one.",
    next: "Proof of delivery is a public Delivery or Signature file, if one was released. If it is missing, it was not marked public.",
  },
  {
    status: "exception",
    label: "Exception",
    means: "The movement left the usual path. The events are the record of what was written.",
    next: "Contact support with the tracking number. The page will not guess the cause.",
  },
  {
    status: "cancelled",
    label: "Cancelled",
    means: "Staff recorded that this shipment will not continue.",
    next: "Use the contact form if you were not told why. Do not expect further transit events.",
  },
] as const;

export const QUESTIONS = [
  {
    q: "What does a QCORVAZENT tracking number look like?",
    a: "NKD-YYYYMMDD-XXXX. Example shape: NKD-20260927-1042. Issued numbers keep this form, including shipments opened before the QCORVAZENT name. The date is the day the number was issued. The last four digits are assigned by the desk, not chosen by the customer.",
  },
  {
    q: "Can I track with my company’s reference instead?",
    a: "No. The public page accepts only the QCORVAZENT tracking number, in the form NKD-YYYYMMDD-XXXX. Staff can search a reference inside the desk. If you were given both, use the NKD number here.",
  },
  {
    q: "Why are names missing from the tracking page?",
    a: "Sender and recipient names, phone numbers, street addresses, and internal notes are operational. They are stored, and they are not published.",
  },
  {
    q: "Which statuses can a shipment show?",
    a: "Pickup scheduled, picked up, processing, in transit, arrived at a facility, customs clearance, out for delivery, and delivered. Exception and cancelled are recorded when the movement leaves that path. Each change is an event.",
  },
  {
    q: "Will I get an email when the status changes?",
    a: "Not yet. The contact form saves a message for staff. Email and SMS stay off until a provider is connected, so do not wait for an automatic reply.",
  },
  {
    q: "Can I open a photo or PDF from the tracking page?",
    a: "Only when operations marked that file public. Other evidence stays in the private shipment-evidence bucket. Images are accepted up to 10 MB and PDFs up to 20 MB.",
  },
  {
    q: "What if the number is not found?",
    a: "Check the characters, including the dashes. The site will not guess a nearby shipment. If it still does not open, send the number you were given through the contact form.",
  },
  {
    q: "How do I ask for a quote or a pickup?",
    a: "Use Get a quote or Request a pickup. Both save a pending request for staff. Neither one calculates a price or creates a tracking number. A number is issued only when staff open the shipment.",
  },
  {
    q: "Why has tracking not updated?",
    a: "The page changes when staff record an event. It does not poll a vehicle. If the window you were given has passed, send the tracking number through Contact and choose Tracking assistance.",
  },
  {
    q: "Can the website tell me a delivery date?",
    a: "Only when staff have published a transit window for that service, country pair, and speed. Otherwise the estimator says staff confirmation is required. A window is not a guarantee and not a price. A date on a live shipment appears only if staff stored an estimated or actual delivery date.",
  },
  {
    q: "What does TEST / DEMO on a tracking page mean?",
    a: "That record was marked demonstration data. It is not a customer shipment. Live movements are booked with that mark left off.",
  },
] as const;
