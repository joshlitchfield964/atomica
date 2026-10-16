# -*- coding: utf-8 -*-
"""EDL: every beat mapped to a shot, with a reason. Times are VO timecodes.
Shot durations are derived from the next shot's start, so the picture can never drift
from the narration."""
R="/tmp/claude-0/-home-user-atomica/e15b684b-c126-5141-91b7-b79bfd6b6ee8/scratchpad/film/tesla-roadster/renders/"

# ---- asset shorthand ----
RAMP4K ="video/x_2110915963399135731_teslarati_reaction_2160p.mp4"      # 4K ramp climb / inversion
BARREL ="video/x_2110901625007092065_shacknews_barrel-roll_1080p.mp4"   # HD, end card after 58s
KICK   ="video/x_2110904206122983917_shacknews_kickflip_1080p.mp4"
FINAL  ="video/x_2110907625604812957_shacknews_final-jump_1080p.mp4"
TRACK4K="video/x_2110905133785829671_tesla_track-mode_2160p.mp4"        # 4K studio, active aero
WILD4K ="video/x_2110876911048266042_sawyer_this-is-wild_2160p.mp4"     # 4K daytime pre-show
MIDAIR ="video/x_2110901393238474863_collinrugg_midair-flip.mp4"
SEMI   ="video/x_2110903392092799123_kanekoa_kickflip-semi_1080p.mp4"
HUD    ="video/x_2110900915326877940_drivetesla_fly.mp4"                # telemetry overlay
ALEF4K ="video/videopress_alef_BUaZKwVz_2160p.mp4"
E2017  ="video/yt_5RRmepp7i5g_Tesla Semi & Roadster Unveil.mp4"         # 360p -> archive frame
EVENT  ="video/yt_qt5p-_tE8d0_Roadster Event.mp4"                       # 360p -> archive frame

AERIAL="images/event_site_aerial_night_motortrend.jpg"
HERO  ="images/event_hero_flyoff_ramp_motortrend.png"
INVERT="images/event_ramp_top_blue_thrusters_motortrend.jpg"
UPSIDE="images/event_upside_down_suction_drive_motortrend.jpg"
MIDFLIP="images/event_midair_flip_motortrend.jpg"
LEVIT ="images/event_levitating_thrusters_motortrend.jpg"
TIMER ="images/demo_060_timer_frame_motortrend.jpg"
PLUME ="images/demo_060_launch_plume_motortrend.jpg"
MUSK  ="images/stage_musk_car_rear_crowd_motortrend.jpg"
MUSK2 ="images/stage_musk_holzhausen_motortrend.jpg"
SPOIL ="images/car_spoiler_fan_detail_teslarati.jpg"
RED17 ="images/reveal_2017_prototype_red_nypost.jpg"
GREY17="images/reveal_2017_prototype_grey_commons.jpg"
RLAUNCH="images/event_ramp_launch_night_motortrend.jpg"
RSTRUCT="images/ramp_structure_night_motortrend.jpg"
CARREAR="images/car_rear_at_ramp_base_motortrend.jpg"
CARSIDE="images/car_side_profile_doors_up_motortrend.jpg"
MIDOVER="images/event_midair_over_ramp_motortrend.jpg"
INVFLIP="images/event_inverted_flip_night_motortrend.jpg"
YOKE  ="images/interior_yoke_dashboard_motortrend.jpg"
SEATS ="images/interior_seats_red_motortrend.jpg"
ALEFI ="images/competitor_alef_model_a_commons.jpg"
XPENG ="images/competitor_xpeng_x2_commons.png"
JOBY  ="images/competitor_joby_s4_commons.jpg"
LILIUM="images/competitor_lilium_jet_commons.jpg"
NEVERA="images/competitor_rimac_nevera_commons.jpg"
BATT  ="images/competitor_pininfarina_battista_commons.jpg"
FLYALT="images/official_tesla_fly_altitude_techcrunch.jpg"

def S(t,src,kind="still",**kw):
    d=dict(t=t,src=src,kind=kind); d.update(kw); return d
def V(t,src,i,**kw):  return S(t,src,"video",**dict(kw,**{"in":i}))
def G(t,name,i=0.0,**kw): return S(t,R+name,"gfx",**dict(kw,**{"in":i}))

# ken-burns presets: direction varied so the film is not all push-ins
PI  =lambda p=(.5,.5),a=1.00,b=1.06: {"z0":a,"z1":b,"px":p[0],"py":p[1]}   # push in
PO  =lambda p=(.5,.5),a=1.07,b=1.00: {"z0":a,"z1":b,"px":p[0],"py":p[1]}   # pull out
DR  =lambda p0=.38,p1=.62,z=1.05:    {"z0":z,"z1":z,"px":p0,"py":.5,"pxe":p1}

EDL=[
# ============================ A0 — COLD OPEN ============================
S(0.55, HERO,  kb=PI((.52,.46),1.00,1.05), why="headline image: the car in the air. Opens on the claim itself."),
V(3.08, RAMP4K, 0.6, why="4K: car at the ramp base. 'That's the headline' lands on the real object."),
S(5.35, AERIAL, kb=PO((.46,.52),1.08,1.01), why="pull out on 'not quite true' — isolate the spectacle, show it is staged."),
V(7.11, RAMP4K, 19.4, why="inversion with thruster plume under 'the part that isn't true'."),
S(8.78, INVERT, kb=PI((.52,.42),1.00,1.06), why="hold the inverted car as 'that's the entire story' lands."),
V(10.92, BARREL, 27.8, why="'no wings, no rotors' — show the bare underside, nothing but nozzles."),
V(14.50, BARREL, 45.6, why="the flight itself, mid-sentence, so the promise is already evidenced."),
S(19.53, LEVIT, kb=PI((.47,.55),1.00,1.07), why="thruster plumes = 'the one engineering detail'. Seeds the air motif."),
V(24.10, RAMP4K, 13.0, why="smoke mass: the air being spent, before we know that matters."),
S(28.10, MUSK, kb=PI((.56,.5),1.00,1.05), why="'what it really is' — put the author of the claim on screen."),
S(31.30, HERO, kb=PO((.52,.46),1.06,1.00), why="callback to the opening frame on 'it's not a flying car'."),
V(33.86, EVENT, 1282.0, treat="archive", why="'actual event footage' — show the source, framed and credited."),
V(37.83, TRACK4K, 6.0, why="Tesla's own promo cut under 'Tesla's own posts'."),
S(40.55, CARSIDE, kb=DR(.40,.60), why="lateral drift on 'not the press release' — neutral, factual."),
G(42.09, "g01.mp4", why="TITLE on 'Let's go'. Hard cut in, music lift."),
# ============================ A1 — THE EVENT ============================
S(45.95, RSTRUCT, kb=PI((.5,.55),1.00,1.05), why="the ramp as architecture: 'not a car showroom'."),
S(48.07, AERIAL, kb=PI((.46,.5),1.01,1.07), crop=[2975,1540,0,0], why="'not an auto expo' — the site is a rocket range."),
V(50.54, RAMP4K, 31.8, why="wide night site under the McGregor/7:55 PM description."),
S(54.20, AERIAL, kb=DR(.34,.58), why="red lasers and fog, exactly as narrated."),
S(57.60, RLAUNCH, kb=PI((.62,.5),1.00,1.06), why="'a ramp that looks like a half pipe' — the ramp, lit."),
V(61.83, RAMP4K, 1.2, why="the car rolls up the ramp. Action matches the line."),
S(63.53, CARREAR, kb=PI((.5,.52),1.00,1.05), why="'with nobody inside it' — rear view, empty cabin implied."),
V(65.35, RAMP4K, 18.9, why="climbs to full inversion — the literal action."),
S(67.24, INVERT, kb=PI((.5,.45),1.02,1.07), why="hold on 'upside down' for one beat of disbelief."),
V(68.71, BARREL, 45.2, why="the barrel roll. HIT 1 lands here."),
V(71.11, KICK, 24.0, why="the kickflip over the lineup — the money shot, speed-ramped."),
V(75.02, SEMI, 21.0, why="different angle including the Semi, as narrated."),
V(79.40, FINAL, 17.5, why="corkscrew straight off the ground."),
S(82.00, TIMER, kb=PI((.42,.62),1.00,1.05), why="the on-screen timer frame — 0-60 is about to be named."),
S(84.71, PLUME, kb=PO((.5,.5),1.06,1.00), why="'hold onto it' — pull back, park the number for later."),
S(87.56, MUSK, kb=PI((.58,.48),1.00,1.06), why="'Musk walks out' — the man, the claim."),
S(90.47, MUSK2, kb=PI((.45,.5),1.00,1.05), why="'Flying cars are real' on a second stage angle."),
V(92.39, EVENT, 1340.0, treat="archive", why="his own words, from his own stream, framed as archive."),
S(96.52, AERIAL, kb=PO((.5,.5),1.07,1.01), why="pull out to the crowd: 'nobody in the crowd seemed to notice'."),
S(99.50, CARREAR, kb=PI((.5,.5),1.00,1.06), why="'the car was driverless' — the empty seat is the point."),
S(105.80, YOKE, kb=PI((.5,.5),1.00,1.05), why="the empty cockpit under 'that's a joke / it's also a confession'."),
# ============================ A2 — THE TELL ============================
S(108.90, RSTRUCT, kb=PO((.5,.5),1.06,1.00), why="'ask yourself this' — step back, start reasoning."),
S(110.70, AERIAL, kb=PI((.5,.5),1.01,1.06), why="'why does a car launch need a rocket range' over the range itself."),
V(114.50, WILD4K, 3.0, why="daylight test area: the infrastructure a road car would never need."),
S(118.00, RLAUNCH, kb=DR(.56,.40), why="wind/airspace: the ramp exposed to open sky."),
S(121.38, CARSIDE, kb=PI((.5,.5),1.00,1.05), why="'a road car doesn't care about wind' — an ordinary car, ordinary framing."),
S(124.10, LEVIT, kb=PI((.47,.58),1.00,1.07), why="'a car that leaves the ground does' — airborne, plumes lit."),
V(126.44, RAMP4K, 24.5, why="the postponement tell, over the real site."),
S(129.38, MIDOVER, kb=PI((.5,.45),1.00,1.06), why="'flies like an aircraft' — aircraft-like framing, sky behind."),
# ============================ A3 — HOW IT WORKS ============================
S(133.54, UPSIDE, kb=PI((.5,.5),1.00,1.05), why="'no wings, no rotors' — the underside, visibly bare."),
S(136.81, SPOIL, kb=DR(.42,.58), why="active aero detail: the only 'wing' is a spoiler."),
V(138.18, TRACK4K, 14.0, why="'two systems' — the transform sequence shows both."),
S(141.64, LEVIT, kb=PI((.47,.56),1.00,1.07), why="'first, cold gas thrusters' — the plumes themselves."),
V(144.33, BARREL, 27.6, why="10 nozzles around the car, visible firing."),
S(149.00, INVFLIP, kb=PI((.5,.48),1.00,1.06), why="600 L / COPV detail beat — keep the car airborne while specs land."),
S(153.00, SPOIL, kb=PI((.5,.5),1.00,1.05), why="hardware insert under the tank description."),
V(157.67, TRACK4K, 20.0, why="Tesla's own words quoted — use Tesla's own footage."),
S(162.57, LEVIT, kb=PO((.47,.56),1.07,1.00), why="'no combustion, no flame' — cold white gas, not fire."),
V(166.22, FINAL, 20.0, why="'ultra high pressure air fired through nozzles'."),
S(169.93, MIDOVER, kb=PI((.5,.5),1.00,1.06), why="'a spacecraft's attitude thrusters' — the attitude-control pose."),
S(173.54, PLUME, kb=PI((.4,.6),1.00,1.06), why="80 kN claim, over the biggest plume in the pack."),
S(176.65, TIMER, kb=DR(.45,.58), why="'his number, not an independent measurement' — Tesla's own HUD."),
S(180.17, UPSIDE, kb=PI((.5,.5),1.00,1.05), why="'second' — cut to the fan system, visible fan discs."),
V(181.03, BARREL, 36.6, why="the suction run under the ramp: the fan doing the work."),
S(186.63, UPSIDE, kb=PI((.5,.52),1.02,1.07), why="'more than two Gs of grip' on the inverted drive."),
V(189.51, RAMP4K, 19.2, why="'enough to drive the thing upside down' — the proof shot."),
S(193.45, LEVIT, kb=PI((.47,.5),1.00,1.05), why="'the thrusters push it up'."),
S(195.27, UPSIDE, kb=PO((.5,.5),1.06,1.00), why="'the fan pushes it down' — direct visual rhyme, opposite motion."),
V(197.51, TRACK4K, 26.0, why="'two systems, opposite directions' — the transform shows both at once."),
S(200.14, HERO, kb=PI((.52,.46),1.00,1.05), why="hold the hero image under the thesis setup."),
S(203.30, MUSK, kb=PI((.56,.5),1.00,1.04), why="'here's my take' — author's turn, steady framing."),
S(205.42, UPSIDE, kb=PI((.5,.5),1.00,1.06), why="'the suction fan is the product' — the fan is on screen as it is named."),
S(207.72, SPOIL, kb=PI((.5,.5),1.00,1.04), why="'why?' — one beat on hardware before the answer."),
S(208.55, LEVIT, kb=PO((.47,.56),1.07,1.01), why="'a finite tank of air' — plumes spending it."),
V(211.75, EVENT, 1455.0, treat="archive", why="Tesla's X post quoted — show the source."),
S(215.40, FLYALT, kb=PI((.5,.5),1.00,1.05), treat="archive", why="Tesla's own altitude graphic under 'more gas = more flight time'."),
S(219.08, INVERT, kb=PI((.5,.45),1.00,1.06), why="'the tank is the limit' — hold, let it land."),
# ============================ A4 — NINE YEARS ============================
S(223.46, RED17, kb=PI((.5,.5),1.00,1.05), why="hard reset to 2017: the red prototype, a different era."),
V(229.32, E2017, 1572.0, treat="archive", why="the 2017 reveal itself, framed as archive (360p source)."),
S(234.00, GREY17, kb=DR(.40,.60), why="specs beat: 1.9s / 620 mi / $200k over the prototype."),
S(239.62, RED17, kb=PI((.44,.56),1.02,1.07), why="'$50,000 deposits wired that night' — the object people paid for."),
V(243.94, E2017, 1596.0, treat="archive", why="'production promised for 2020' from the stage."),
S(247.68, GREY17, kb=PO((.5,.5),1.06,1.00), why="'what did those people get? hold that thought' — pull away, unresolved."),
G(249.26, "g04.mp4", why="the slipped-date rail opens and runs the whole 2018-2026 sequence."),
# g04 is 52s and carries 249.26 -> 301.3; cut back to footage for the 2026 run-up
S(301.38, RLAUNCH, kb=PI((.6,.5),1.00,1.05), why="'then August. Nothing.' — the empty ramp as the no-show."),
S(303.78, AERIAL, kb=PI((.46,.5),1.01,1.06), why="'September 12th, go for launch'."),
S(306.40, RSTRUCT, kb=PO((.5,.5),1.06,1.00), why="'October 1st, postponed. Wind.' — the ramp, unused."),
V(309.38, RAMP4K, 0.8, why="'October 15th, it finally happens' — the car arrives at the ramp."),
V(312.74, KICK, 27.5, why="'1 car that left the ground for a few seconds' — the few seconds themselves."),
S(316.00, MIDFLIP, kb=PI((.5,.48),1.00,1.06), why="hold the airborne frame into the smash cut."),
# ============================ A5 — THE TRIMS ============================
S(318.92, CARSIDE, kb=PI((.5,.5),1.00,1.05), why="'here's what actually got announced' — product framing, showroom light."),
G(321.00, "g05.mp4", why="the trim ladder builds across all three trims as they are named."),
S(352.30, SEATS, kb=PI((.5,.5),1.00,1.06), why="'one seat' made physical — the interior, single occupant."),
S(354.09, HERO, kb=PO((.52,.46),1.06,1.00), why="'Tesla's flying car' headline framing, pulled back."),
S(359.98, RED17, kb=PI((.5,.5),1.00,1.05), why="'those 2017 deposit holders' — back to what they bought."),
S(364.26, YOKE, kb=DR(.42,.58), why="reservations reopen: the product interior, as a sales object."),
S(370.18, SEATS, kb=PI((.5,.5),1.00,1.05), why="'the one that flies?' — single seat again, now loaded."),
S(373.16, MUSK, kb=PI((.56,.5),1.00,1.05), why="'you get invited' — the gatekeeper on screen."),
S(374.79, MIDFLIP, kb=PI((.5,.46),1.00,1.07), why="'9 years of waiting' over the thing that finally flew."),
# ============================ A6 — THE NUMBER ============================
S(379.91, TIMER, kb=PI((.42,.62),1.00,1.06), why="'let's talk about 0.81 seconds' — the timer frame, again."),
V(383.72, HUD, 4.0, why="Tesla's own telemetry HUD: the instrument that produced the number."),
S(387.53, PLUME, kb=PI((.45,.55),1.00,1.05), why="'I believe the car is absurdly fast' — give the claim its due."),
V(390.82, FINAL, 12.0, why="genuine violence of the launch, honestly shown."),
S(396.42, TIMER, kb=PI((.42,.6),1.02,1.07), why="'the least honest number' — push into the readout itself."),
S(401.79, AERIAL, kb=PO((.46,.5),1.07,1.01), why="'a closed rocket range' — the closedness is the point."),
S(405.54, CARREAR, kb=PI((.5,.5),1.00,1.05), why="'in a car with no driver' — empty cabin."),
V(409.00, HUD, 14.0, why="'no independent instrument anywhere in sight' — only Tesla's own overlay."),
G(417.16, "g06.mp4", why="claimed vs verified table: Nevera, Battista, Roadster."),
S(447.98, NEVERA, kb=PI((.5,.5),1.00,1.05), why="'that's the rule' — close on a car that was actually measured."),
S(450.70, MUSK2, kb=PI((.45,.5),1.00,1.05), why="'Tesla's best framing came from their own account'."),
V(453.77, TRACK4K, 2.0, why="4-5x tire force quote over Tesla's own promo footage."),
S(458.79, UPSIDE, kb=PI((.5,.5),1.00,1.06), why="'that's the honest pitch' — the grip system, the real product."),
S(460.49, PLUME, kb=PI((.45,.55),1.00,1.06), why="'about acceleration, not flight'."),
S(463.18, HERO, kb=PO((.52,.46),1.06,1.00), why="'the flying is the marketing' over the marketing image."),
S(465.10, MIDFLIP, kb=PI((.5,.47),1.00,1.06), why="'the launch is the product' — HIT 4 lands on the airborne frame."),
# ============================ A7 — THE RIVALS ============================
S(467.05, HERO, kb=PI((.52,.46),1.00,1.04), why="bridge beat before the rivals arrive."),
V(472.55, ALEF4K, 2.0, why="Alef's car flying over the Roadster — the rival's own answer."),
S(479.24, ALEFI, kb=PI((.5,.5),1.00,1.05), why="'FAA-certified, hand-building customer cars' — the actual vehicle."),
V(483.75, ALEF4K, 12.0, why="'hosted a video of their car flying over the new Roadster'."),
S(487.27, ALEFI, kb=PI((.46,.52),1.02,1.07), why="the Dukhovny quote — hold on Alef's machine as he speaks."),
V(492.00, ALEF4K, 24.0, why="'we've been here alone for 11 years' — their flight, their claim."),
S(496.55, ALEFI, kb=PO((.5,.5),1.06,1.00), why="'the entire industry dynamic in one sentence'."),
S(500.52, XPENG, kb=PI((.5,.5),1.00,1.05), why="'he's not alone out there' — next rival."),
S(502.31, XPENG, kb=DR(.40,.60), why="XPeng: 7,000 pre-orders, deliveries this year."),
S(508.49, JOBY, kb=PI((.5,.5),1.00,1.05), why="Joby: passengers in electric aircraft this year."),
S(514.06, LILIUM, kb=PI((.5,.5),1.00,1.04), why="Lilium named — the aircraft that existed."),
S(517.67, LILIUM, kb=PO((.5,.5),1.05,1.00), why="'$3.3 billion valuation' — pull out as the number is said."),
S(520.90, LILIUM, kb=PI((.5,.5),1.00,1.03), why="'is dead' — hold still, no music. Stated, not mocked."),
S(525.26, ALEFI, kb=PI((.5,.5),1.00,1.05), why="'Alef and XPeng sell travel' — back to the ones that go somewhere."),
S(530.76, JOBY, kb=PI((.5,.5),1.00,1.05), why="'Joby sells rides'."),
S(532.74, HERO, kb=PI((.52,.46),1.00,1.06), why="'Tesla sells spectacle' — the spectacle image itself."),
S(534.76, MIDOVER, kb=PO((.5,.48),1.06,1.00), why="'the only flying car here that can't go anywhere'."),
S(539.24, HERO, kb=PI((.52,.46),1.00,1.05), why="'the honest differentiator' — land on the image it describes."),
# ============================ A8 — THE ONE DETAIL ============================
S(541.90, LEVIT, kb=PI((.47,.56),1.00,1.06), why="'the detail Tesla hopes you don't think about' — the plumes return."),
G(545.83, "g08.mp4", why="the air-tank drain. The film's clock, paid off in real time."),
S(571.49, INVERT, kb=PI((.5,.45),1.00,1.05), why="after the tank empties: the car, inert, inverted."),
S(575.00, MIDOVER, kb=PO((.5,.5),1.06,1.00), why="'it does not travel' — airborne but going nowhere."),
S(578.00, RSTRUCT, kb=DR(.56,.42), why="the refill question: the ground equipment nobody asked about."),
S(582.22, AERIAL, kb=PI((.46,.5),1.01,1.05), why="'how many hops per hour? Unknown.'"),
S(583.30, MUSK, kb=PI((.56,.5),1.00,1.05), why="'the questions Musk dodged' — put him back on screen."),
V(588.65, EVENT, 1510.0, treat="archive", why="'yeah, depends on your street' — his actual answer, from the stream."),
S(593.74, CARSIDE, kb=PI((.5,.5),1.00,1.04), why="'that's the whole answer' — the car, unexplained."),
S(597.45, YOKE, kb=DR(.44,.58), why="no price, no FAA certificate — interior as the undelivered product."),
S(602.95, CARREAR, kb=PI((.5,.5),1.00,1.05), why="'not approved for public road use' — a car that cannot use a road."),
V(607.75, FINAL, 24.0, why="'the thrusters were deafening' — the loudest footage in the pack."),
S(613.00, PLUME, kb=PI((.42,.58),1.00,1.07), why="'10 rocket nozzles going off in traffic'."),
S(617.00, AERIAL, kb=PO((.46,.5),1.07,1.00), why="'no regulator on earth is approving that' — pull out to the closed site."),
S(621.00, MIDOVER, kb=PI((.5,.48),1.00,1.05), why="'a car that can fly, but may never be allowed to'. Smash to silence."),
# ============================ A9 — THE VERDICT ============================
S(624.46, HERO, kb=PI((.52,.46),1.00,1.04), why="'so, what is it, really' — return to the opening image."),
S(627.56, UPSIDE, kb=PI((.5,.5),1.00,1.05), why="'suction-gripped' — name each part, show each part."),
S(631.50, LEVIT, kb=PI((.47,.56),1.00,1.05), why="'thruster-assisted'."),
V(633.50, TRACK4K, 9.0, why="'track monster wearing a flying car costume'."),
S(636.52, HERO, kb=PO((.52,.46),1.06,1.00), why="'and the costume worked' — the image that did the work."),
S(640.30, MUSK, kb=PI((.56,.5),1.00,1.05), why="'best of the last human-driven cars' — his words, his face."),
S(644.78, MUSK2, kb=PI((.45,.5),1.00,1.04), why="'small potato situation'."),
S(649.35, PLUME, kb=DR(.40,.60), why="the Snake River Canyon tease — a stunt, framed as a stunt."),
S(653.83, MUSK, kb=PI((.56,.5),1.00,1.05), why="'read between those lines'."),
S(658.09, CARSIDE, kb=PI((.5,.5),1.00,1.05), why="'it's a statement' — the object as statement."),
S(660.49, HERO, kb=PI((.52,.46),1.00,1.06), why="'the world's most spectacular science project'."),
S(663.98, INVERT, kb=PI((.5,.45),1.00,1.05), why="'but here's the twist' — after a full second of silence."),
S(667.50, LEVIT, kb=PI((.47,.56),1.00,1.06), why="'the same thrusters that make it fly'."),
S(671.69, PLUME, kb=PI((.42,.58),1.00,1.06), why="'the noise, the back blast, the certification wall'."),
S(675.56, UPSIDE, kb=PO((.5,.5),1.06,1.00), why="'the physics that makes the demo possible'."),
S(680.84, CARREAR, kb=PI((.5,.5),1.00,1.05), why="'keeps it off your street' — the car, parked, going nowhere."),
G(682.75, "g09.mp4", why="the verdict card. HIT 6 on 'a rocket you can park'."),
# ============================ A10 — OUTRO ============================
S(693.75, HERO, kb=PO((.52,.46),1.06,1.00), why="outro over the hero image; frame kept clear for the end screen."),
]
END=700.108
