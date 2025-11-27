import { getUserLanguage } from '@/lib/utils/language'
import type { SupportedLanguage } from '@/lib/core/types'

export type TranslationKey =
  | 'features'
  | 'pricing'
  | 'contact'
  | 'login'
  | 'tripGuide'
  | 'memories'
  | 'memories.page.title'
  | 'memories.page.description'
  | 'memories.page.empty'
  | 'memories.page.year'
  | 'plan.page.title'
  | 'plan.page.empty'
  | 'header.profile'
  | 'header.changePlan'
  | 'header.logout'
  | 'devTools'
  | 'debug.badge'
  // Footer
  | 'footer.tagline'
  | 'footer.products'
  | 'footer.products.summary'
  | 'footer.resources'
  | 'footer.company'
  | 'footer.releaseNotes'
  | 'footer.documentation'
  | 'footer.blog'
  | 'footer.faq'
  | 'footer.support'
  | 'footer.backToTop'
  | 'footer.privacyPolicy'
  | 'footer.termsOfService'
  | 'footer.cookieSettings'
  | 'footer.about'
  | 'footer.backToTopAria'
  | 'footer.copyright'
  // Features page
  | 'features.intro'
  | 'features.section1.title'
  | 'features.section2.title'
  | 'features.section3.title'
  | 'features.s1.map.title'
  | 'features.s1.map.li1'
  | 'features.s1.map.li2'
  | 'features.s1.map.li3'
  | 'features.s1.checklist.title'
  | 'features.s1.checklist.li1'
  | 'features.s1.checklist.li2'
  | 'features.s2.share.title'
  | 'features.s2.share.li1'
  | 'features.s2.share.li2'
  | 'features.s2.pdf.title'
  | 'features.s2.pdf.li1'
  | 'features.s2.pdf.li2'
  | 'features.s3.cost.title'
  | 'features.s3.cost.li1'
  | 'features.s3.cost.li2'
  | 'features.s3.optimize.title'
  | 'features.s3.optimize.li1'
  | 'features.s3.optimize.li2'
  // Pricing page
  | 'pricing.intro'
  | 'pricing.choosePlan'
  | 'pricing.cta.title'
  | 'pricing.cta.subtitle'
  | 'pricing.cta.support'
  | 'pricing.cta.docs'
  | 'pricing.season.subtitle'
  | 'pricing.season.li1'
  | 'pricing.season.li2'
  | 'pricing.season.li3'
  | 'pricing.backpacker.subtitle'
  | 'pricing.backpacker.li1'
  | 'pricing.backpacker.li2'
  | 'pricing.backpacker.li3'
  | 'pricing.globetrotter.subtitle'
  | 'pricing.globetrotter.li1'
  | 'pricing.globetrotter.li2'
  | 'pricing.globetrotter.li3'
  | 'pricing.price.season'
  | 'pricing.price.backpacker'
  | 'pricing.price.globetrotter'
  // Contact page
  | 'contact.title'
  | 'contact.sectionTitle'
  | 'contact.success'
  | 'contact.name'
  | 'contact.email'
  | 'contact.subject'
  | 'contact.subject.placeholder'
  | 'contact.subject.bug'
  | 'contact.subject.feature'
  | 'contact.subject.account'
  | 'contact.subject.billing'
  | 'contact.subject.other'
  | 'contact.message'
  | 'contact.message.placeholder'
  | 'contact.submit'
  | 'contact.submitting'
  | 'contact.info.title'
  | 'contact.info.general'
  | 'contact.info.urgent'
  | 'contact.info.responseTime'
  | 'contact.info.faq'
  // About page
  | 'about.hero.line1'
  | 'about.hero.line2'
  | 'about.hero.line3'
  | 'about.intro'
  | 'about.story.title'
  | 'about.story.p1'
  | 'about.story.p2'
  | 'about.story.p3'
  | 'about.mission.title'
  | 'about.mission.simplicity.title'
  | 'about.mission.simplicity.text'
  | 'about.mission.collab.title'
  | 'about.mission.collab.text'
  | 'about.mission.security.title'
  | 'about.mission.security.text'
  | 'about.building.title'
  | 'about.building.item1.title'
  | 'about.building.item1.text'
  | 'about.building.item2.title'
  | 'about.building.item2.text'
  | 'about.building.item3.title'
  | 'about.building.item3.text'
  | 'about.stats.year'
  | 'about.stats.possibility'
  | 'about.stats.passion'
  | 'about.cta.title'
  | 'about.cta.subtitle'
  | 'about.cta.contact'
  | 'about.cta.getStarted'
  // Terms page
  | 'terms.title'
  | 'terms.updated'
  | 'terms.s1.title'
  | 'terms.s1.p1'
  | 'terms.s2.title'
  | 'terms.s2.intro'
  | 'terms.s2.li1'
  | 'terms.s2.li2'
  | 'terms.s2.li3'
  | 'terms.s2.li4'
  | 'terms.s2.li5'
  | 'terms.s3.title'
  | 'terms.s3.intro'
  | 'terms.s3.li1'
  | 'terms.s3.li2'
  | 'terms.s3.li3'
  | 'terms.s3.li4'
  | 'terms.s4.title'
  | 'terms.s4.intro'
  | 'terms.s4.li1'
  | 'terms.s4.li2'
  | 'terms.s4.li3'
  | 'terms.s4.li4'
  | 'terms.s4.li5'
  | 'terms.s5.title'
  | 'terms.s5.p1'
  | 'terms.s6.title'
  | 'terms.s6.p1'
  | 'terms.s7.title'
  | 'terms.s7.p1'
  | 'terms.s7.contact'
  // Docs page
  | 'docs.title1'
  | 'docs.title2'
  | 'docs.intro'
  | 'docs.search.title'
  | 'docs.search.placeholder'
  | 'docs.guides.title'
  | 'docs.shortcuts.title'
  | 'docs.shortcuts.support'
  | 'docs.shortcuts.support.sub'
  | 'docs.shortcuts.faq'
  | 'docs.shortcuts.faq.sub'
  | 'docs.shortcuts.releases'
  | 'docs.shortcuts.releases.sub'
  | 'docs.cta.title'
  | 'docs.cta.subtitle'
  | 'docs.cta.support'
  | 'docs.cta.faq'
  | 'docs.empty'
  // Blog list page
  | 'blog.title1'
  | 'blog.title2'
  | 'blog.intro'
  | 'blog.search.title'
  | 'blog.search.placeholder'
  | 'blog.latest'
  | 'blog.empty'
  | 'blog.cta.title'
  | 'blog.cta.subtitle'
  | 'blog.cta.support'
  | 'blog.cta.docs'
  // Blog post page
  | 'blog.post.notfound.title'
  | 'blog.post.notfound.desc'
  | 'blog.post.back'
  // Home (Top) page
  | 'home.hero.line1'
  | 'home.hero.line2'
  | 'home.hero.line3'
  | 'home.intro'
  | 'home.cta.primary.title'
  | 'home.cta.primary.button'
  | 'home.cta.primary.seeFeatures'
  | 'home.features.title'
  | 'home.features.card1.title'
  | 'home.features.card1.text'
  | 'home.features.card2.title'
  | 'home.features.card2.text'
  | 'home.features.card3.title'
  | 'home.features.card3.text'
  | 'home.cta.bottom.title'
  | 'home.cta.bottom.subtitle'
  | 'home.cookie.title'
  | 'home.cookie.text'
  | 'home.cookie.more'
  | 'home.cookie.reject'
  | 'home.cookie.accept'
  // Home Dashboard page (/home)
  | 'home.dashboard.recentlyChecked.title'
  | 'home.dashboard.recentlyChecked.empty'
  | 'home.dashboard.recentlyChecked.planned'
  | 'home.dashboard.memories.title'
  | 'home.dashboard.memories.count'
  | 'home.dashboard.memories.viewAll'
  | 'home.dashboard.upcomingTrips.title'
  | 'home.dashboard.upcomingTrips.count'
  | 'home.dashboard.upcomingTrips.viewAll'
  | 'home.dashboard.upcomingTrips.empty'
  | 'home.dashboard.upcomingTrips.today'
  | 'home.dashboard.ongoingTrips.title'
  | 'home.dashboard.ongoingTrips.subtitle'
  | 'home.dashboard.ongoingTrips.more'
  | 'home.dashboard.ongoingTrips.empty'
  | 'home.dashboard.ongoingTrips.createNew'
  | 'home.dashboard.ongoingTrips.period'
  | 'home.dashboard.ongoingTrips.remainingDays'
  | 'home.dashboard.ongoingTrips.untilToday'
  | 'home.dashboard.countryStats.title'
  | 'home.dashboard.countryStats.summary'
  | 'home.dashboard.countryStats.times'
  | 'home.dashboard.countryStats.empty'
  | 'home.dashboard.countryStats.error'
  | 'home.dashboard.countryStats.retry'
  | 'home.dashboard.countryStats.viewDetails'
  | 'home.dashboard.planInfo.error'
  | 'home.dashboard.planInfo.tripLimit'
  | 'home.dashboard.planInfo.tripLimitCount'
  | 'home.dashboard.planInfo.changePlan'
  | 'home.dashboard.nextTrip.title'
  | 'home.dashboard.nextTrip.createNew'
  | 'home.dashboard.nextTrip.create'
  | 'home.dashboard.nextTrip.description'
  | 'home.dashboard.nextTrip.createDescription'
  | 'home.dashboard.nextTrip.empty.title'
  | 'home.dashboard.nextTrip.empty.description'
  | 'home.dashboard.nextTrip.empty.mapPlaceholder'
  | 'home.dashboard.nextTrip.empty.mapDescription'
  | 'home.dashboard.storage.title'
  | 'home.dashboard.storage.inUse'
  | 'home.dashboard.storage.files'
  | 'home.dashboard.storage.fetchError'
  | 'home.dashboard.storage.deleteError'
  | 'home.dashboard.storage.retry'
  | 'home.dashboard.storage.details.title'
  | 'home.dashboard.storage.details.warning'
  | 'home.dashboard.storage.details.upgradeSuggestion'
  | 'home.dashboard.storage.details.limitReached'
  | 'home.dashboard.storage.details.history'
  | 'home.dashboard.storage.details.fileName'
  | 'home.dashboard.storage.details.size'
  | 'home.dashboard.storage.details.type'
  | 'home.dashboard.storage.details.dateTime'
  | 'home.dashboard.storage.details.action'
  | 'home.dashboard.storage.details.avatar'
  | 'home.dashboard.storage.details.tripImage'
  | 'home.dashboard.storage.details.deleting'
  | 'home.dashboard.storage.details.delete'
  | 'home.dashboard.storage.details.refresh'
  // Home Dashboard header row (/home welcome section)
  | 'home.welcome.title'
  | 'home.welcome.subtitle'
  | 'home.welcome.createTrip'
  | 'home.welcome.quickPlan'
  | 'home.welcome.createGuide'
  // Home Dashboard main tabs (/home left column)
  | 'home.mainTabs.shares'
  // Profile page
  | 'profile.back'
  | 'profile.title'
  | 'profile.setup'
  | 'profile.edit'
  | 'profile.cancel'
  | 'profile.loading'
  | 'profile.setupBanner.title'
  | 'profile.setupBanner.description'
  | 'profile.name'
  | 'profile.bio'
  | 'profile.bio.placeholder'
  | 'profile.bio.empty'
  | 'profile.residenceArea'
  | 'profile.residenceArea.placeholder'
  | 'profile.residenceArea.warning'
  | 'profile.estimatedCountry'
  | 'profile.gender'
  | 'profile.gender.preferNotToSay'
  | 'profile.gender.male'
  | 'profile.gender.female'
  | 'profile.gender.other'
  | 'profile.language'
  | 'profile.language.auto'
  | 'profile.language.description'
  | 'profile.save'
  | 'profile.saving'
  | 'profile.complete'
  | 'profile.skip'
  | 'profile.image.title'
  | 'profile.image.change'
  | 'profile.image.upload'
  | 'profile.image.uploading'
  | 'profile.image.formats'
  | 'profile.image.alt'
  | 'profile.image.invalid'
  | 'profile.image.uploadFailed'
  | 'profile.image.unknownError'
  | 'profile.image.deleteFailed'
  | 'profile.publicTrips.title'
  | 'profile.publicTrips.empty'
  | 'profile.publicTrips.empty.description'
  | 'profile.privateTrips.title'
  | 'profile.privateTrips.empty'
  | 'profile.privateTrips.empty.description'
  | 'profile.stats.title'
  | 'profile.stats.totalTrips'
  | 'profile.stats.totalCountries'
  | 'profile.stats.countries.title'
  | 'profile.stats.times'
  | 'profile.stats.countries.more'
  // iCal Publish Modal
  | 'ical.title'
  | 'ical.close'
  | 'ical.closeButton'
  | 'ical.premiumFeature'
  | 'ical.premiumFeatureDescription'
  | 'ical.about.title'
  | 'ical.about.li1'
  | 'ical.about.li2'
  | 'ical.about.li3'
  | 'ical.about.li4'
  | 'ical.enabled'
  | 'ical.disable'
  | 'ical.tripUrl'
  | 'ical.reservationsUrl'
  | 'ical.copy'
  | 'ical.copied'
  | 'ical.addToCalendar.title'
  | 'ical.addToCalendar.google'
  | 'ical.addToCalendar.apple'
  | 'ical.addToCalendar.outlook'
  | 'ical.disabled'
  | 'ical.enabling'
  | 'ical.enable'
  | 'ical.enableError'
  | 'ical.disableConfirm'
  | 'ical.disableError'
  | 'ical.planRequired'
  // Trip Itinerary Page
  | 'trip.calendarPublish'
  | 'trip.itinerary'
  | 'trip.schedule.time'
  | 'trip.schedule.cost'
  | 'trip.schedule.reservation'
  | 'trip.schedule.activity'
  | 'trip.schedule.categorySelect'
  | 'trip.schedule.categoryDetail'
  | 'trip.schedule.clear'
  | 'trip.schedule.selected'
  | 'trip.schedule.saveFailed'
  | 'subscription.error'
  | 'trip.routeOptimization.title'
  | 'trip.routeOptimization.button'
  | 'trip.routeOptimization.optimizing'
  | 'trip.routeOptimization.needTwoOrMore'
  | 'trip.routeOptimization.failed'
  | 'trip.routeOptimization.error'
  | 'trip.routeOptimization.calculatePlaces'
  | 'trip.routeOptimization.optimizedOrder'
  | 'trip.routeOptimization.apply'
  | 'trip.routeOptimization.cancel'
  | 'trip.routeOptimization.applyFailed'
  | 'trip.itineraryView.title'
  | 'trip.itineraryView.addDay'
  | 'trip.itineraryView.expandAll'
  | 'trip.itineraryView.collapseAll'
  | 'trip.itineraryView.empty.title'
  | 'trip.itineraryView.empty.description'
  // Day Editor
  | 'dayEditor.placeholder'
  | 'dayEditor.saving'
  | 'dayEditor.editHint'
  | 'dayEditor.clickToEdit'
  | 'dayEditor.updateError'
  | 'dayEditor.deleteDay'
  | 'dayEditor.deleteConfirm'
  | 'dayEditor.deleteConfirmWithItineraries'
  | 'dayEditor.deleteError'
  // Navigation Menu
  | 'nav.weatherForecast'
  | 'nav.reservation'
  | 'nav.reservationTitle'
  | 'nav.travelCost'
  | 'nav.budgetTitle'
  | 'nav.activityStats'
  | 'nav.activityStatisticsTitle'
  | 'nav.totalDistance'
  | 'nav.distancesTitle'
  | 'nav.schedule'
  | 'nav.summary'
  | 'nav.itinerary'
  | 'nav.checklist'
  | 'nav.plan'
  | 'nav.profile'
  | 'nav.logout'
  | 'nav.dayPrefix'
  | 'nav.dayAbbr'
  // Common
  | 'common.close'
  | 'common.deleteFailed'
  | 'common.deleteError'
  | 'common.cancel'
  | 'common.save'
  | 'common.saving'
  | 'common.delete'
  | 'common.retry'
  | 'common.goHome'
  // Admin / Dev Tools
  | 'admin.logs.timezone.deleteConfirm'
  | 'admin.logs.currency.deleteConfirm'
  | 'admin.logs.deleteAllConfirm'
  | 'admin.logs.timezone.processed'
  | 'admin.logs.currency.processed'
  | 'admin.logs.mapping.updated'
  | 'admin.logs.insufficientLogs'
  | 'admin.logs.batchFailed'
  // Schedule
  | 'schedule.time.updateFailed'
  | 'schedule.cost.updateFailed'
  // Export Data Modal
  | 'export.error'
  | 'export.description.trip.json'
  | 'export.description.trip.csv'
  | 'export.description.trip.ical'
  | 'export.description.reservation.json'
  | 'export.description.reservation.csv'
  | 'export.description.reservation.ical'
  // Subscription Modal
  | 'subscription.processing'
  | 'subscription.startNow'
  // Place Search Input
  | 'placeSearch.placeholder'
  | 'placeSearch.searchFailed'
  | 'placeSearch.detailsFailed'
  | 'placeSearch.noResults'
  | 'placeSearch.selectFailed'
  // Common UI
  | 'common.dragHandle'
  | 'common.openMenu'
  | 'schedule.addVenueBetween'
  // Checklist
  | 'checklist.addItem'
  // Route Optimization
  | 'routeOptimization.failed'
  | 'routeOptimization.optimizedRoute'
  | 'routeOptimization.loading'
  | 'routeOptimization.noResult'
  | 'routeOptimization.totalDistance'
  | 'routeOptimization.totalDuration'
  | 'routeOptimization.optimizedOrder'
  | 'routeOptimization.apiCost'
  | 'routeOptimization.insufficientWaypoints'
  | 'routeCost.failed'
  | 'routeCost.suggestion'
  | 'routeCost.label'
  | 'routeCost.waypoints'
  // Trip Itinerary View
  | 'tripItinerary.invalidDate'
  | 'tripItinerary.dateNotSet'
  | 'tripItinerary.expand'
  | 'tripItinerary.collapse'
  | 'tripItinerary.addVenue'
  | 'tripItinerary.addVenueAtEnd'
  // Schedule Card
  | 'scheduleCard.reservationSaveFailed'
  | 'scheduleCard.collapse'
  | 'scheduleCard.readMore'
  | 'scheduleCard.memo.hasDescription'
  | 'scheduleCard.memo.addMemo'
  // Trip Editor
  | 'tripEditor.dateValidation'
  | 'tripEditor.destinationPlaceholder'
  | 'tripEditor.title'
  | 'tripEditor.destinationReSelectHint'
  | 'tripEditor.accessLevel.private'
  | 'tripEditor.accessLevel.public'
  | 'tripEditor.field.publishStatus'
  | 'tripEditor.publishStatus.draft'
  | 'tripEditor.publishStatus.published'
  | 'tripEditor.field.title'
  | 'tripEditor.field.description'
  | 'tripEditor.field.startDate'
  | 'tripEditor.field.endDate'
  | 'tripEditor.field.accessLevel'
  | 'tripEditor.field.image'
  | 'tripEditor.field.destination'
  | 'tripEditor.field.defaultCurrency'
  | 'tripEditor.field.defaultCurrency.hint'
  | 'tripEditor.currency.major'
  | 'tripEditor.currency.others'
  | 'tripEditor.deleteConfirm.title'
  | 'tripEditor.deleteConfirm.message'
  | 'tripEditor.deleteConfirm.deleting'
  // Image Upload
  | 'imageUpload.invalidFile'
  | 'imageUpload.loginRequired'
  | 'imageUpload.userIdNotFound'
  | 'imageUpload.userInfoNotFound'
  | 'imageUpload.avatar'
  | 'imageUpload.uploadFailed'
  | 'imageUpload.unknownError'
  | 'imageUpload.uploading'
  | 'imageUpload.selectAnother'
  | 'imageUpload.dropHere'
  | 'imageUpload.clickOrDrag'
  | 'imageUpload.error.auth'
  | 'imageUpload.error.auth.description'
  | 'imageUpload.error.canceled'
  | 'imageUpload.error.unknown'
  | 'imageUpload.error.invalidArgument'
  | 'imageUpload.error.invalidChecksum'
  | 'imageUpload.error.invalidFormat'
  | 'imageUpload.error.invalidName'
  | 'imageUpload.error.objectNotFound'
  | 'imageUpload.error.projectNotFound'
  | 'imageUpload.error.quotaExceeded'
  | 'imageUpload.error.unauthenticated'
  | 'imageUpload.error.uploadFailed'
  | 'imageUpload.error.storageQuotaExceeded'
  | 'imageUpload.error.quotaCheckFailed'
  | 'imageUpload.error.storageUsageUpdateFailed'
  // Timezone Log Manager
  | 'timezoneLog.showDetails'
  | 'timezoneLog.hideDetails'
  // Schedule Card Menu
  | 'scheduleCardMenu.moveFailed'
  | 'scheduleCardMenu.duplicateFailed'
  // Venue Distance
  | 'venueDistance.calculationFailed'
  // Country Map
  | 'countryMap.loadFailed'
  // Daily Route Optimizer
  | 'routeOptimizer.unknownPlace'
  // Trip Map
  | 'tripMap.loadFailed'
  | 'tripMap.loadFailedWarning'
  | 'tripMap.overlay.title'
  | 'tripMap.overlay.filtering'
  | 'tripMap.overlay.displayingLocations'
  | 'tripMap.overlay.filteredByDay'
  // Next Trip Map
  | 'nextTripMap.loadFailed'
  // Plan Limits Display
  | 'planLimits.currentPlan'
  | 'planLimits.publicTemplate'
  // Timezone Log Manager
  | 'timezoneLog.processed'
  | 'timezoneLog.latestBatchResults'
  | 'timezoneLog.aboutBatchProcessing'
  // Country Map
  | 'countryMap.tripCount'
  // Inline Cost Editor
  | 'inlineCostEditor.amount'
  | 'inlineCostEditor.currency'
  | 'inlineCostEditor.invalidAmount'
  | 'inlineCostEditor.saveHint'
  | 'inlineCostEditor.saving'
  // Inline Time Editor
  | 'inlineTimeEditor.startTime'
  | 'inlineTimeEditor.endTime'
  | 'inlineTimeEditor.timezone'
  | 'inlineTimeEditor.invalidFormat'
  | 'inlineTimeEditor.saveHint'
  | 'inlineTimeEditor.saving'
  // Timezone Options
  | 'timezone.UTC'
  | 'timezone.japan_tokyo'
  | 'timezone.america_new_york'
  | 'timezone.america_los_angeles'
  | 'timezone.europe_london'
  | 'timezone.europe_paris'
  | 'timezone.asia_seoul'
  | 'timezone.asia_shanghai'
  | 'timezone.asia_hong_kong'
  | 'timezone.asia_singapore'
  | 'timezone.asia_bangkok'
  | 'timezone.asia_kolkata'
  | 'timezone.australia_sydney'
  | 'timezone.pacific_honolulu'
  | 'timezone.pacific_guam'
  | 'timezone.pacific_saipan'
  // Add Schedule Modal
  | 'addScheduleModal.title'
  | 'addScheduleModal.searchLabel'
  | 'addScheduleModal.searchPlaceholder'
  | 'addScheduleModal.searchButton'
  | 'addScheduleModal.searching'
  | 'addScheduleModal.searchResults'
  | 'addScheduleModal.tryDifferentKeyword'
  // User Settings Page
  | 'userSettingsPage.saveSuccess'
  | 'userSettingsPage.saveFailed'
  | 'userSettingsPage.saveButton'
  | 'userSettingsPage.saving'
  // Admin Failure Logs Page
  | 'adminFailureLogs.processed'
  | 'adminFailureLogs.aboutThisPage'
  // Country Stats
  | 'countryStats.noTrips'
  | 'countryStats.recommendedTrips'
  // Recommended Trips
  | 'recommendedTrips.title'
  // Premium Feature
  | 'premium.unlimitedTrips'
  | 'premium.allPremiumFeatures'
  // Trip Slug Page
  | 'tripSlugPage.pdfRequiresBackpacker'
  | 'tripSlugPage.pdfExportFailed'
  | 'tripSlugPage.fetchTripFailed'
  | 'tripSlugPage.fetchTripFailedDescription'
  | 'tripSlugPage.notFoundDescription'
  | 'tripSlugPage.addDayFailed'
  | 'tripSlugPage.addPOIFailed'
  | 'tripSlugPage.orderUpdateFailed'
  // Currency Names (37 currencies × 2 keys)
  | 'currency.JPY.name'
  | 'currency.JPY.country'
  | 'currency.USD.name'
  | 'currency.USD.country'
  | 'currency.EUR.name'
  | 'currency.EUR.country'
  | 'currency.GBP.name'
  | 'currency.GBP.country'
  | 'currency.KRW.name'
  | 'currency.KRW.country'
  | 'currency.CNY.name'
  | 'currency.CNY.country'
  | 'currency.HKD.name'
  | 'currency.HKD.country'
  | 'currency.SGD.name'
  | 'currency.SGD.country'
  | 'currency.THB.name'
  | 'currency.THB.country'
  | 'currency.TWD.name'
  | 'currency.TWD.country'
  | 'currency.AUD.name'
  | 'currency.AUD.country'
  | 'currency.CAD.name'
  | 'currency.CAD.country'
  | 'currency.CHF.name'
  | 'currency.CHF.country'
  | 'currency.INR.name'
  | 'currency.INR.country'
  | 'currency.MYR.name'
  | 'currency.MYR.country'
  | 'currency.IDR.name'
  | 'currency.IDR.country'
  | 'currency.PHP.name'
  | 'currency.PHP.country'
  | 'currency.VND.name'
  | 'currency.VND.country'
  | 'currency.MXN.name'
  | 'currency.MXN.country'
  | 'currency.SEK.name'
  | 'currency.SEK.country'
  | 'currency.NOK.name'
  | 'currency.NOK.country'
  | 'currency.DKK.name'
  | 'currency.DKK.country'
  | 'currency.PLN.name'
  | 'currency.PLN.country'
  | 'currency.CZK.name'
  | 'currency.CZK.country'
  | 'currency.HUF.name'
  | 'currency.HUF.country'
  | 'currency.RUB.name'
  | 'currency.RUB.country'
  | 'currency.AED.name'
  | 'currency.AED.country'
  | 'currency.SAR.name'
  | 'currency.SAR.country'
  | 'currency.ILS.name'
  | 'currency.ILS.country'
  | 'currency.TRY.name'
  | 'currency.TRY.country'
  | 'currency.ZAR.name'
  | 'currency.ZAR.country'
  | 'currency.BRL.name'
  | 'currency.BRL.country'
  | 'currency.ARS.name'
  | 'currency.ARS.country'
  | 'currency.CLP.name'
  | 'currency.CLP.country'
  | 'currency.COP.name'
  | 'currency.COP.country'
  | 'currency.PEN.name'
  | 'currency.PEN.country'
  | 'currency.NZD.name'
  | 'currency.NZD.country'
  // Trip New Page
  | 'tripNew.dateValidation'
  | 'tripNew.destinationRequired'
  | 'tripNew.startDateRequired'
  | 'tripNew.endDateRequired'
  | 'tripNew.title'
  | 'tripNew.destinationPlaceholder'
  | 'tripNew.titlePlaceholder'
  | 'tripNew.descriptionPlaceholder'
  | 'tripNew.accessLevel.private'
  | 'tripNew.accessLevel.public'
  | 'tripNew.createButton'
  | 'tripNew.creating'
  // Not Found Page
  | 'notFound.title'
  // Image Gallery
  | 'gallery.previousImage'
  | 'gallery.nextImage'
  | 'gallery.cached'
  | 'gallery.photosOf'
  | 'gallery.photoCount'
  // POI Dialog
  | 'poi.website'
  | 'poi.reviewCount'
  | 'poi.cached'
  | 'poi.loading'
  | 'poi.loadingInfo'
  | 'poi.photoOf'
  | 'poi.fetchDetailsError'
  | 'poi.fetchError'
  | 'poi.imageCacheError'
  | 'poi.errorMessage'
  | 'poi.addToItinerary'
  | 'poi.showPartial'
  | 'poi.showAll'
  | 'poi.reviewsAndTips'
  | 'poi.helpfulVotes'
  | 'poi.daySelector.title'
  | 'poi.openingHours.open'
  | 'poi.openingHours.closed'
  | 'poi.openingHours.openingSoon'
  | 'poi.openingHours.open24h'
  | 'poi.openingHours.closedDay'
  | 'poi.businessStatus.temporarilyClosed'
  | 'poi.businessStatus.permanentlyClosed'
  | 'poi.weekday.sunday'
  | 'poi.weekday.monday'
  | 'poi.weekday.tuesday'
  | 'poi.weekday.wednesday'
  | 'poi.weekday.thursday'
  | 'poi.weekday.friday'
  | 'poi.weekday.saturday'
  | 'poi.weekday.sundayShort'
  | 'poi.weekday.mondayShort'
  | 'poi.weekday.tuesdayShort'
  | 'poi.weekday.wednesdayShort'
  | 'poi.weekday.thursdayShort'
  | 'poi.weekday.fridayShort'
  | 'poi.weekday.saturdayShort'
  // Reservation Display
  | 'reservation.title'
  | 'reservation.empty'
  | 'reservation.empty.description'
  | 'reservation.count'
  | 'reservation.timeRange'
  // Activity Analysis Display
  | 'activity.analysis.empty'
  | 'activity.analysis.empty.description'
  | 'activity.analysis.total'
  | 'activity.analysis.categoryDistribution'
  | 'activity.analysis.detailsTop5'
  | 'activity.analysis.times'
  // Activity Categories
  | 'activity.primary.transportation'
  | 'activity.primaryShort.transportation'
  | 'activity.primary.shopping'
  | 'activity.primaryShort.shopping'
  | 'activity.primary.dining'
  | 'activity.primaryShort.dining'
  | 'activity.primary.accommodation'
  | 'activity.primaryShort.accommodation'
  | 'activity.primary.exploration'
  | 'activity.primaryShort.exploration'
  | 'activity.primary.adventure'
  | 'activity.primaryShort.adventure'
  | 'activity.primary.entertainment'
  | 'activity.primaryShort.entertainment'
  | 'activity.primary.culture'
  | 'activity.primaryShort.culture'
  | 'activity.primary.wellness'
  | 'activity.primaryShort.wellness'
  | 'activity.primary.service'
  | 'activity.primaryShort.service'
  // Activity Secondary Categories
  // Transportation
  | 'activity.secondary.transportation.flight'
  | 'activity.secondary.transportation.flight.description'
  | 'activity.secondary.transportation.train'
  | 'activity.secondary.transportation.train.description'
  | 'activity.secondary.transportation.bus'
  | 'activity.secondary.transportation.bus.description'
  | 'activity.secondary.transportation.taxi'
  | 'activity.secondary.transportation.taxi.description'
  | 'activity.secondary.transportation.car_rental'
  | 'activity.secondary.transportation.car_rental.description'
  | 'activity.secondary.transportation.personal_car'
  | 'activity.secondary.transportation.personal_car.description'
  | 'activity.secondary.transportation.parking'
  | 'activity.secondary.transportation.parking.description'
  | 'activity.secondary.transportation.ferry'
  | 'activity.secondary.transportation.ferry.description'
  | 'activity.secondary.transportation.bike'
  | 'activity.secondary.transportation.bike.description'
  | 'activity.secondary.transportation.scooter'
  | 'activity.secondary.transportation.scooter.description'
  | 'activity.secondary.transportation.gas_station'
  | 'activity.secondary.transportation.gas_station.description'
  | 'activity.secondary.transportation.toll_payment'
  | 'activity.secondary.transportation.toll_payment.description'
  // Shopping
  | 'activity.secondary.shopping.souvenir'
  | 'activity.secondary.shopping.souvenir.description'
  | 'activity.secondary.shopping.grocery'
  | 'activity.secondary.shopping.grocery.description'
  | 'activity.secondary.shopping.fashion'
  | 'activity.secondary.shopping.fashion.description'
  | 'activity.secondary.shopping.electronics'
  | 'activity.secondary.shopping.electronics.description'
  | 'activity.secondary.shopping.local_market'
  | 'activity.secondary.shopping.local_market.description'
  | 'activity.secondary.shopping.duty_free'
  | 'activity.secondary.shopping.duty_free.description'
  | 'activity.secondary.shopping.bookstore'
  | 'activity.secondary.shopping.bookstore.description'
  // Dining
  | 'activity.secondary.dining.breakfast'
  | 'activity.secondary.dining.breakfast.description'
  | 'activity.secondary.dining.lunch'
  | 'activity.secondary.dining.lunch.description'
  | 'activity.secondary.dining.dinner'
  | 'activity.secondary.dining.dinner.description'
  | 'activity.secondary.dining.cafe'
  | 'activity.secondary.dining.cafe.description'
  | 'activity.secondary.dining.bar'
  | 'activity.secondary.dining.bar.description'
  | 'activity.secondary.dining.food_tour'
  | 'activity.secondary.dining.food_tour.description'
  | 'activity.secondary.dining.street_food'
  | 'activity.secondary.dining.street_food.description'
  | 'activity.secondary.dining.fine_dining'
  | 'activity.secondary.dining.fine_dining.description'
  // Accommodation
  | 'activity.secondary.accommodation.check_in'
  | 'activity.secondary.accommodation.check_in.description'
  | 'activity.secondary.accommodation.check_out'
  | 'activity.secondary.accommodation.check_out.description'
  | 'activity.secondary.accommodation.car_camping'
  | 'activity.secondary.accommodation.car_camping.description'
  | 'activity.secondary.accommodation.camping'
  | 'activity.secondary.accommodation.camping.description'
  | 'activity.secondary.accommodation.hostel_stay'
  | 'activity.secondary.accommodation.hostel_stay.description'
  | 'activity.secondary.accommodation.airbnb'
  | 'activity.secondary.accommodation.airbnb.description'
  | 'activity.secondary.accommodation.luxury_hotel'
  | 'activity.secondary.accommodation.luxury_hotel.description'
  // Exploration
  | 'activity.secondary.exploration.city_walk'
  | 'activity.secondary.exploration.city_walk.description'
  | 'activity.secondary.exploration.nature_walk'
  | 'activity.secondary.exploration.nature_walk.description'
  | 'activity.secondary.exploration.photography'
  | 'activity.secondary.exploration.photography.description'
  | 'activity.secondary.exploration.observation'
  | 'activity.secondary.exploration.observation.description'
  | 'activity.secondary.exploration.architecture'
  | 'activity.secondary.exploration.architecture.description'
  | 'activity.secondary.exploration.park'
  | 'activity.secondary.exploration.park.description'
  // Adventure
  | 'activity.secondary.adventure.hiking'
  | 'activity.secondary.adventure.hiking.description'
  | 'activity.secondary.adventure.trekking'
  | 'activity.secondary.adventure.trekking.description'
  | 'activity.secondary.adventure.diving'
  | 'activity.secondary.adventure.diving.description'
  | 'activity.secondary.adventure.snorkeling'
  | 'activity.secondary.adventure.snorkeling.description'
  | 'activity.secondary.adventure.rock_climbing'
  | 'activity.secondary.adventure.rock_climbing.description'
  | 'activity.secondary.adventure.caving'
  | 'activity.secondary.adventure.caving.description'
  | 'activity.secondary.adventure.safari'
  | 'activity.secondary.adventure.safari.description'
  | 'activity.secondary.adventure.jungle_trek'
  | 'activity.secondary.adventure.jungle_trek.description'
  // Entertainment
  | 'activity.secondary.entertainment.theme_park'
  | 'activity.secondary.entertainment.theme_park.description'
  | 'activity.secondary.entertainment.beach'
  | 'activity.secondary.entertainment.beach.description'
  | 'activity.secondary.entertainment.water_sports'
  | 'activity.secondary.entertainment.water_sports.description'
  | 'activity.secondary.entertainment.casino'
  | 'activity.secondary.entertainment.casino.description'
  | 'activity.secondary.entertainment.nightlife'
  | 'activity.secondary.entertainment.nightlife.description'
  | 'activity.secondary.entertainment.game_center'
  | 'activity.secondary.entertainment.game_center.description'
  | 'activity.secondary.entertainment.karaoke'
  | 'activity.secondary.entertainment.karaoke.description'
  | 'activity.secondary.entertainment.movie'
  | 'activity.secondary.entertainment.movie.description'
  // Culture
  | 'activity.secondary.culture.museum'
  | 'activity.secondary.culture.museum.description'
  | 'activity.secondary.culture.art_gallery'
  | 'activity.secondary.culture.art_gallery.description'
  | 'activity.secondary.culture.aquarium'
  | 'activity.secondary.culture.aquarium.description'
  | 'activity.secondary.culture.temple_shrine'
  | 'activity.secondary.culture.temple_shrine.description'
  | 'activity.secondary.culture.historical_site'
  | 'activity.secondary.culture.historical_site.description'
  | 'activity.secondary.culture.local_festival'
  | 'activity.secondary.culture.local_festival.description'
  | 'activity.secondary.culture.theater'
  | 'activity.secondary.culture.theater.description'
  | 'activity.secondary.culture.traditional_experience'
  | 'activity.secondary.culture.traditional_experience.description'
  | 'activity.secondary.culture.workshop'
  | 'activity.secondary.culture.workshop.description'
  // Wellness
  | 'activity.secondary.wellness.spa'
  | 'activity.secondary.wellness.spa.description'
  | 'activity.secondary.wellness.massage'
  | 'activity.secondary.wellness.massage.description'
  | 'activity.secondary.wellness.yoga'
  | 'activity.secondary.wellness.yoga.description'
  | 'activity.secondary.wellness.gym'
  | 'activity.secondary.wellness.gym.description'
  | 'activity.secondary.wellness.meditation'
  | 'activity.secondary.wellness.meditation.description'
  | 'activity.secondary.wellness.hot_spring'
  | 'activity.secondary.wellness.hot_spring.description'
  | 'activity.secondary.wellness.detox'
  | 'activity.secondary.wellness.detox.description'
  // Service
  | 'activity.secondary.service.laundry'
  | 'activity.secondary.service.laundry.description'
  | 'activity.secondary.service.currency_exchange'
  | 'activity.secondary.service.currency_exchange.description'
  | 'activity.secondary.service.hospital'
  | 'activity.secondary.service.hospital.description'
  | 'activity.secondary.service.visa_application'
  | 'activity.secondary.service.visa_application.description'
  | 'activity.secondary.service.sim_purchase'
  | 'activity.secondary.service.sim_purchase.description'
  | 'activity.secondary.service.post_office'
  | 'activity.secondary.service.post_office.description'
  | 'activity.secondary.service.atm'
  | 'activity.secondary.service.atm.description'
  | 'activity.secondary.service.baggage_storage'
  | 'activity.secondary.service.baggage_storage.description'
  // Distance Display
  | 'distance.title'
  | 'distance.loading'
  | 'distance.error.calculationFailed'
  | 'distance.error.totalCalculationFailed'
  | 'distance.empty.noPlaces'
  | 'distance.empty.needTwoOrMore'
  | 'distance.empty.description'
  | 'distance.visitedPlaces'
  | 'distance.total'
  | 'distance.totalTime'
  | 'distance.average'
  | 'distance.averageTime'
  | 'distance.perSegment'
  | 'distance.perTimeSegment'
  | 'distance.hint.details'
  | 'distance.openTransit'
  | 'distance.openTransitUnavailable'
  // Travel Cost Display
  | 'cost.title'
  | 'cost.empty'
  | 'cost.empty.description'
  | 'cost.items'
  | 'cost.total'
  | 'cost.hint.edit'
  | 'cost.viewDetails'
  | 'cost.collapse'
  // Date formatting
  | 'date.notSet'
  | 'date.daysLater'
  | 'date.days'
  | 'date.dayTrip'
  | 'date.yearsAgo'
  | 'date.monthsAgo'
  | 'date.thisMonth'
  | 'date.year'
  | 'date.month'
  // Weather Forecast
  | 'weather.title'
  | 'weather.loading'
  | 'weather.error.fetchFailed'
  | 'weather.error.notAvailable'
  | 'weather.empty.noData'
  | 'weather.empty.noDestination'
  | 'weather.hint.forecastLimit'
  | 'weather.partialForecast'
  | 'weather.constraint.title'
  | 'weather.constraint.message'
  | 'weather.constraint.remainingDays'
  | 'weather.rainyDays'
  | 'weather.averageWindSpeed'
  | 'weather.average'
  | 'weather.range'
  | 'weather.days'
  | 'weather.only'
  | 'weather.unknown'
  | 'weather.forecastedBy'
  | 'unit.mm'
  | 'unit.kmh'
  | 'unit.km'
  | 'unit.hour'
  | 'unit.minute'
  | 'weather.code.0'
  | 'weather.code.1'
  | 'weather.code.2'
  | 'weather.code.3'
  | 'weather.code.45'
  | 'weather.code.48'
  | 'weather.code.51'
  | 'weather.code.53'
  | 'weather.code.55'
  | 'weather.code.56'
  | 'weather.code.57'
  | 'weather.code.61'
  | 'weather.code.63'
  | 'weather.code.65'
  | 'weather.code.66'
  | 'weather.code.67'
  | 'weather.code.71'
  | 'weather.code.73'
  | 'weather.code.75'
  | 'weather.code.77'
  | 'weather.code.80'
  | 'weather.code.81'
  | 'weather.code.82'
  | 'weather.code.85'
  | 'weather.code.86'
  | 'weather.code.95'
  | 'weather.code.96'
  | 'weather.code.99'
  | 'date.day'
  // Create Trip Dialog
  | 'trip.create.title'
  | 'trip.create.destination.label'
  | 'trip.create.destination.placeholder'
  | 'trip.create.destination.hint'
  | 'trip.create.startDate.label'
  | 'trip.create.endDate.label'
  | 'trip.create.dateError'
  | 'trip.create.dateValidation.startBeforeEnd'
  | 'trip.create.dateAutoAdjusted'
  | 'trip.create.advancedSettings'
  | 'trip.create.mode.label'
  | 'trip.create.mode.trip'
  | 'trip.create.mode.tripDescription'
  | 'trip.create.mode.template'
  | 'trip.create.mode.templateDescription'
  | 'trip.create.mode.templateDescriptionLocked'
  | 'trip.create.mode.templateUpgradeHint'
  | 'trip.create.visibilityNotice'
  | 'trip.create.title.label'
  | 'trip.create.title.placeholder'
  | 'trip.create.description.label'
  | 'trip.create.description.placeholder'
  | 'trip.create.imageLoading'
  | 'trip.create.imageLoaded'
  | 'trip.create.accessLevel.label'
  | 'trip.create.accessLevel.private.label'
  | 'trip.create.accessLevel.private.description'
  | 'trip.create.accessLevel.public.description'
  | 'trip.create.templateMode.label'
  | 'trip.create.templateMode.description.active'
  | 'trip.create.templateMode.description.inactive'
  | 'trip.create.dayCount.label'
  | 'trip.create.dayCount.placeholder'
  | 'trip.create.dayCount.description'
  | 'trip.create.validation.dayCountRequired'
  | 'trip.template.upgradeRequired'
  | 'trip.template.replicate'
  | 'trip.template.replicating'
  | 'trip.template.replicateFailed'
  | 'trip.publish.button'
  | 'trip.publish.templateButton'
  | 'trip.publish.publishing'
  | 'trip.publish.templatePublishing'
  | 'trip.publish.success'
  | 'trip.publish.failed'
  | 'trip.template.replicateDialogTitle'
  | 'trip.template.replicateStartDateLabel'
  | 'trip.template.replicateDayCountSummary'
  | 'trip.template.replicateEndDatePreview'
  | 'trip.template.replicateEndDateHint'
  | 'trip.template.replicateStartDateError'
  | 'trip.likes.loading'
  | 'trip.likes.button.like'
  | 'trip.likes.button.liked'
  | 'trip.likes.loginRequired'
  | 'trip.likes.error'
  | 'trip.likes.count'
  | 'trip.create.cancel'
  | 'trip.create.submitting'
  | 'trip.create.submit'
  | 'trip.create.validation.destinationRequired'
  | 'trip.create.validation.startDateRequired'
  | 'trip.create.validation.endDateRequired'
  | 'trip.create.startDate.placeholder'
  | 'trip.create.startDate.hint'
  | 'trip.create.endDate.placeholder'
  | 'trip.create.endDate.hint'
  // Checklist
  | 'checklist.title'
  | 'checklist.applyPreset'
  | 'checklist.myPresets'
  | 'checklist.saveAsPreset'
  | 'checklist.regenerating'
  | 'checklist.regenerate'
  | 'checklist.loading'
  | 'checklist.preparing.title'
  | 'checklist.preparing.subtitle'
  | 'checklist.packing.title'
  | 'checklist.packing.subtitle'
  | 'checklist.noItems'
  | 'checklist.delete'
  | 'checklist.addCustom.placeholder'
  | 'checklist.addCustom.add'
  | 'checklist.preset.saveSuccess'
  | 'checklist.preset.applySuccess'
  | 'checklist.preset.saveModal.title'
  | 'checklist.preset.saveModal.titleLabel'
  | 'checklist.preset.saveModal.titlePlaceholder'
  | 'checklist.preset.saveModal.descriptionLabel'
  | 'checklist.preset.saveModal.descriptionPlaceholder'
  | 'checklist.preset.saveModal.tagsLabel'
  | 'checklist.preset.saveModal.tagsPlaceholder'
  | 'checklist.preset.saveModal.isPublic'
  | 'checklist.preset.saveModal.cancel'
  | 'checklist.preset.saveModal.saving'
  | 'checklist.preset.saveModal.save'
  | 'checklist.preset.saveModal.titleRequired'
  | 'checklist.preset.saveModal.saveFailed'
  | 'checklist.myPresets.title'
  | 'checklist.myPresets.loading'
  | 'checklist.myPresets.empty'
  | 'checklist.myPresets.public'
  | 'checklist.myPresets.private'
  | 'checklist.myPresets.usageCount'
  | 'checklist.myPresets.itemsCount'
  | 'checklist.myPresets.delete'
  | 'checklist.myPresets.close'
  | 'checklist.myPresets.deleteConfirm'
  | 'checklist.myPresets.deleteFailed'
  | 'checklist.library.title'
  | 'checklist.library.searchPlaceholder'
  | 'checklist.library.sortPopular'
  | 'checklist.library.sortRecent'
  | 'checklist.library.loading'
  | 'checklist.library.empty'
  | 'checklist.library.apply'
  | 'checklist.library.close'
  | 'checklist.library.applyFailed'
  | 'checklist.nav.preparing.subtitle'
  | 'checklist.nav.packing.subtitle'
  | 'checklist.nav.preparing.title'
  | 'checklist.nav.packing.title'
  // Loading messages
  | 'loading.message'
  | 'loading.mapLoading'
  | 'loading.saving'
  | 'loading.calculating'
  | 'loading.addingSchedule'
  | 'loading.updating'
  | 'loading.updatingDescription'
  // Privacy Policy
  | 'privacy.title'
  | 'privacy.lastUpdated'
  | 'privacy.preface.title'
  | 'privacy.preface.content'
  | 'privacy.collection.title'
  | 'privacy.collection.intro'
  | 'privacy.collection.googleAccount'
  | 'privacy.collection.travelData'
  | 'privacy.collection.location'
  | 'privacy.collection.usage'
  | 'privacy.purpose.title'
  | 'privacy.purpose.intro'
  | 'privacy.purpose.service'
  | 'privacy.purpose.authentication'
  | 'privacy.purpose.management'
  | 'privacy.purpose.improvement'
  | 'privacy.purpose.support'
  | 'privacy.sharing.title'
  | 'privacy.sharing.content'
  | 'privacy.protection.title'
  | 'privacy.protection.content'
  | 'privacy.contact.title'
  | 'privacy.contact.content'
  // Reservation Categories
  | 'reservation.type.flight'
  | 'reservation.type.rentalCar'
  | 'reservation.type.hotel'
  | 'reservation.type.dining'
  | 'reservation.type.other'
  | 'reservation.site.expedia'
  | 'reservation.site.bookingCom'
  | 'reservation.site.agoda'
  | 'reservation.site.trivago'
  | 'reservation.site.airbnb'
  | 'reservation.site.kayak'
  | 'reservation.site.skyscanner'
  | 'reservation.site.tripadvisor'
  | 'reservation.site.opentable'
  | 'reservation.site.tabelog'
  | 'reservation.site.hotPepper'
  | 'reservation.site.ana'
  | 'reservation.site.jal'
  | 'reservation.site.rakutenTravel'
  | 'reservation.site.jalan'
  | 'reservation.site.other'
  | 'reservation.selectSite'
  | 'reservation.notSet'
  | 'reservation.modal.editTitle'
  | 'reservation.modal.addTitle'
  | 'reservation.modal.loadTemplate'
  | 'reservation.modal.template'
  | 'reservation.modal.saveAsTemplate'
  | 'reservation.template.deleteFailed'
  | 'reservation.template.deleteConfirm'
  | 'reservation.template.createFailed'
  | 'reservation.template.updateFailed'
  | 'reservation.template.empty'
  | 'reservation.template.placeholder.name'
  | 'reservation.template.placeholder.description'
  | 'reservation.template.placeholder.notes'
  | 'reservation.template.useButton'
  | 'reservation.saveFailed'
  | 'schedule.venue.deleteConfirm'
  | 'reservation.validation.airportCode'
  | 'reservation.validation.flightNumber'
  | 'reservation.validation.typeRequired'
  | 'reservation.validation.flightNumberRequired'
  | 'reservation.validation.departureAirportRequired'
  | 'reservation.validation.arrivalAirportRequired'
  | 'reservation.validation.departureDateRequired'
  | 'reservation.validation.arrivalDateRequired'
  | 'reservation.validation.startDateRequired'
  | 'reservation.validation.endDateRequired'
  | 'reservation.validation.reservationUrl'
  | 'reservation.validation.invalidStartOrEnd'
  | 'reservation.validation.endAfterStart'
  | 'reservation.validation.invalidDepartureOrArrival'
  | 'reservation.validation.arrivalAfterDeparture'
  | 'reservation.field.type'
  | 'reservation.field.flightNumber'
  | 'reservation.field.airline'
  | 'reservation.field.departureAirport'
  | 'reservation.field.arrivalAirport'
  | 'reservation.field.departureDateTime'
  | 'reservation.field.arrivalDateTime'
  | 'reservation.field.startDateTime'
  | 'reservation.field.endDateTime'
  | 'reservation.field.confirmationNumber'
  | 'reservation.field.reservationSite'
  | 'reservation.field.reservationUrl'
  | 'reservation.field.notes'
  | 'reservation.placeholder.flightNumber'
  | 'reservation.placeholder.airline'
  | 'reservation.placeholder.departureAirport'
  | 'reservation.placeholder.arrivalAirport'
  | 'reservation.placeholder.confirmationNumber'
  | 'reservation.placeholder.notes'
  | 'reservation.button.cancel'
  | 'reservation.button.save'
  | 'reservation.button.saving'
  | 'reservation.action.openSite'
  | 'user.defaultName'
  | 'plan.seasonTraveler'
  // User Settings Modal
  | 'userSettings.title'
  | 'userSettings.basicInfo'
  | 'userSettings.settings'
  | 'userSettings.label.name'
  | 'userSettings.label.email'
  | 'userSettings.label.currency'
  | 'userSettings.label.homeArea'
  | 'userSettings.label.homeCountry'
  | 'userSettings.label.unitSystem'
  | 'userSettings.unitSystem.metric'
  | 'userSettings.unitSystem.imperial'
  | 'userSettings.description.unitSystem'
  | 'userSettings.label.timezone'
  | 'userSettings.label.language'
  | 'userSettings.label.theme'
  | 'userSettings.label.notifications'
  | 'userSettings.placeholder.name'
  | 'userSettings.placeholder.currency'
  | 'userSettings.placeholder.homeArea'
  | 'userSettings.placeholder.timezone'
  | 'userSettings.placeholder.select'
  | 'userSettings.placeholder.languageAuto'
  | 'userSettings.description.checkingSlug'
  | 'userSettings.description.homeAreaCountryCode'
  | 'userSettings.description.homeCountry'
  | 'userSettings.description.language'
  | 'userSettings.validation.nameMinLength'
  | 'userSettings.validation.nameAvailable'
  | 'userSettings.validation.slugCheckFailed'
  | 'userSettings.validation.nameDuplicate'
  | 'userSettings.success.saved'
  | 'userSettings.error.saveFailed'
  | 'userSettings.error.saveFailedNetwork'
  | 'userSettings.error.unknown'
  | 'userSettings.button.cancel'
  | 'userSettings.button.save'
  | 'userSettings.button.saving'
  | 'userSettings.theme.light'
  | 'userSettings.theme.dark'
  // Country names
  | 'country.JP'
  | 'country.US'
  | 'country.CA'
  | 'country.AU'
  | 'country.NZ'
  | 'country.GB'
  | 'country.DE'
  | 'country.FR'
  | 'country.IT'
  | 'country.ES'
  | 'country.KR'
  | 'country.CN'
  | 'country.TW'
  | 'country.HK'
  | 'country.SG'
  | 'country.TH'
  | 'country.MY'
  | 'country.ID'
  | 'country.PH'
  | 'country.VN'
  | 'country.IN'
  // Trip Guide page
  | 'tripGuide.header.title'
  | 'tripGuide.header.subtitle'
  | 'tripGuide.header.createGuide'
  | 'tripGuide.tabs.draft'
  | 'tripGuide.tabs.published'
  | 'tripGuide.tabs.analytics'
  | 'tripGuide.draft.title'
  | 'tripGuide.draft.empty'
  | 'tripGuide.draft.emptySubtitle'
  | 'tripGuide.published.title'
  | 'tripGuide.published.empty'
  | 'tripGuide.published.emptySubtitle'
  | 'tripGuide.card.public'
  | 'tripGuide.card.sharedLink'
  | 'tripGuide.card.draft'
  | 'tripGuide.card.untitled'
  | 'tripGuide.card.updated'
  | 'tripGuide.card.edit'
  | 'tripGuide.card.publish'
  | 'tripGuide.card.unpublish'
  | 'tripGuide.card.analytics'
  | 'tripGuide.analytics.overview'
  | 'tripGuide.analytics.totalGuides'
  | 'tripGuide.analytics.publishedGuides'
  | 'tripGuide.analytics.draftGuides'
  | 'tripGuide.analytics.totalViews'
  | 'tripGuide.analytics.totalLikes'
  | 'tripGuide.analytics.totalReplicas'
  | 'tripGuide.analytics.popularGuides'
  | 'tripGuide.analytics.noPopularGuides'
  | 'tripGuide.analytics.untitled'
  | 'tripGuide.analytics.views'
  | 'tripGuide.analytics.likes'
  | 'tripGuide.analytics.replicas'
  | 'tripGuide.modals.publish.title'
  | 'tripGuide.modals.publish.message'
  | 'tripGuide.modals.publish.untitled'
  | 'tripGuide.modals.publish.publishing'
  | 'tripGuide.modals.publish.confirm'
  | 'tripGuide.modals.publish.cancel'
  | 'tripGuide.modals.unpublish.title'
  | 'tripGuide.modals.unpublish.message'
  | 'tripGuide.modals.unpublish.untitled'
  | 'tripGuide.modals.unpublish.unpublishing'
  | 'tripGuide.modals.unpublish.confirm'
  | 'tripGuide.modals.unpublish.cancel'
  | 'tripGuide.modals.delete.title'
  | 'tripGuide.modals.delete.message'
  | 'tripGuide.modals.delete.untitled'
  | 'tripGuide.modals.delete.deleting'
  | 'tripGuide.modals.delete.confirm'
  | 'tripGuide.modals.delete.cancel'

type Dictionary = Record<TranslationKey, string>

const en: Dictionary = {
  features: 'Features',
  pricing: 'Pricing',
  contact: 'Contact',
  login: 'Log in',
  tripGuide: 'Trip Guide',
  memories: 'Memories',
  'memories.page.title': 'Memories',
  'memories.page.description': 'Look back on your past trips',
  'memories.page.empty': 'No memories yet',
  'memories.page.year': '',
  'plan.page.title': 'Upcoming Trip Plans',
  'plan.page.empty': 'No upcoming trip plans',
  'header.profile': 'Profile',
  'header.changePlan': 'Change Plan',
  'header.logout': 'Logout',
  devTools: 'Dev Tools',
  'debug.badge': 'DEBUG',
  // Footer
  'footer.tagline': 'Make your trips beautifully organized',
  'footer.products': 'Products',
  'footer.products.summary': 'Summary',
  'footer.resources': 'Resources',
  'footer.company': 'Company',
  'footer.about': 'About',
  'footer.releaseNotes': 'Release notes',
  'footer.backToTop': 'Back to top',
  'footer.backToTopAria': 'Back to top',
  'footer.copyright': '© {year} Caglla. All rights reserved.',
  'footer.documentation': 'Documentation',
  'footer.blog': 'Blog',
  'footer.faq': 'FAQ',
  'footer.support': 'Support',
  'footer.privacyPolicy': 'Privacy Policy',
  'footer.termsOfService': 'Terms of Service',
  'footer.cookieSettings': 'Cookie Settings',
  // Privacy Policy page
  'privacy.title': 'Privacy Policy',
  'privacy.lastUpdated': 'Last updated: {date}',
  'privacy.preface.title': 'Preface',
  'privacy.preface.content': 'Caglla Travel Manager (hereinafter referred to as "this service") considers the protection of users\' personal information to be an important responsibility and has established the following privacy policy. By using this service in accordance with this privacy policy, users agree to the protection of their personal information.',
  'privacy.collection.title': 'Collection of Information',
  'privacy.collection.intro': 'This service may collect the following information:',
  'privacy.collection.googleAccount': 'Google account information (name, email address, profile picture)',
  'privacy.collection.travelData': 'Travel plan data (itinerary, accommodation, tourist information)',
  'privacy.collection.location': 'Location information (for map display)',
  'privacy.collection.usage': 'Service usage status (frequency of feature use, error logs)',
  'privacy.purpose.title': 'Purpose of Information Collection',
  'privacy.purpose.intro': 'The collected information is used for the following purposes:',
  'privacy.purpose.service': 'Service provision and operation',
  'privacy.purpose.authentication': 'User authentication and account management',
  'privacy.purpose.management': 'Travel plan storage and management',
  'privacy.purpose.improvement': 'Service improvement and new feature development',
  'privacy.purpose.support': 'Customer support',
  'privacy.sharing.title': 'Sharing of Information',
  'privacy.sharing.content': 'This service does not share personal information with third parties except when the user has consented or when there is a legal obligation.',
  'privacy.protection.title': 'Protection of Data',
  'privacy.protection.content': 'This service uses Firebase (Google Cloud Platform) security features to appropriately protect user data.',
  'privacy.contact.title': 'Contact',
  'privacy.contact.content': 'For questions regarding the privacy policy, please contact us through the <a href="/contact">contact page</a>.',
  // Features page
  'features.intro': 'Caglla strengths, simply explained.',
  'features.section1.title': '1. Features for personal and family trips',
  'features.section2.title': '2. Features for trips with friends',
  'features.section3.title': '3. Features for tour conductors',
  'features.s1.map.title': 'Manage itinerary on map',
  'features.s1.map.li1': 'Edit schedules by day and time intuitively',
  'features.s1.map.li2': 'Check routes on map; auto distance and time calc',
  'features.s1.map.li3': 'Save favorite spots with notes',
  'features.s1.checklist.title': 'Checklist',
  'features.s1.checklist.li1': 'Auto packing suggestions by season and stay length',
  'features.s1.checklist.li2': 'Track progress by category (essentials/clothes/gadgets)',
  'features.s2.share.title': 'Share schedules',
  'features.s2.share.li1': 'Sync via iCal (.ics) to Google/Apple/Outlook',
  'features.s2.share.li2': 'Control permissions (public/private, link sharing)',
  'features.s2.pdf.title': 'PDF export',
  'features.s2.pdf.li1': 'Export itinerary, map links, reservations in clean layout',
  'features.s2.pdf.li2': 'Great for offline (A4/US Letter)',
  'features.s3.cost.title': 'Cost totals',
  'features.s3.cost.li1': 'Auto totals by category/day with currency conversion',
  'features.s3.cost.li2': 'Real-time update with itinerary changes',
  'features.s3.optimize.title': 'Route optimization',
  'features.s3.optimize.li1': 'Auto-optimizes visiting order for multiple waypoints',
  'features.s3.optimize.li2': 'Choose travel mode/avoid (highways/tolls/ferries)',
  // Pricing page
  'pricing.intro': 'Three simple plans. Pay only for what you need.',
  'pricing.choosePlan': 'Choose Your Plan',
  'pricing.cta.title': "Let's get started now",
  'pricing.cta.subtitle': 'Start with the free plan, upgrade anytime.',
  'pricing.cta.support': 'Go to Support',
  'pricing.cta.docs': 'View Documentation',
  'pricing.season.subtitle': 'Basic features',
  'pricing.season.li1': 'Manage Trip/Day/Itinerary',
  'pricing.season.li2': 'Google Maps display',
  'pricing.season.li3': 'Shareable links',
  'pricing.backpacker.subtitle': 'Includes route optimization',
  'pricing.backpacker.li1': 'Everything in season_traveler',
  'pricing.backpacker.li2': 'Route optimization (basic)',
  'pricing.backpacker.li3': 'Custom features',
  'pricing.globetrotter.subtitle': 'All features, no limits',
  'pricing.globetrotter.li1': 'Everything in backpacker',
  'pricing.globetrotter.li2': 'Route optimization (advanced)',
  'pricing.globetrotter.li3': 'Higher limits and priority support',
  'pricing.price.season': '¥0',
  'pricing.price.backpacker': '¥480/mo',
  'pricing.price.globetrotter': '¥980/mo',
  // Contact page
  'contact.title': 'Contact',
  'contact.sectionTitle': 'Contact Us',
  'contact.success': 'Thank you for your inquiry. We will get back to you shortly.',
  'contact.name': 'Name',
  'contact.email': 'Email Address',
  'contact.subject': 'Subject',
  'contact.subject.placeholder': 'Please select',
  'contact.subject.bug': 'Bug Report',
  'contact.subject.feature': 'Feature Request',
  'contact.subject.account': 'Account',
  'contact.subject.billing': 'Billing & Plans',
  'contact.subject.other': 'Other',
  'contact.message': 'Message',
  'contact.message.placeholder': 'Please provide details about your inquiry',
  'contact.submit': 'Submit',
  'contact.submitting': 'Submitting...',
  'contact.info.title': 'Contact Information',
  'contact.info.general': 'For general questions, bug reports, and feature requests, please use the form above.',
  'contact.info.urgent': 'We will prioritize critical security issues.',
  'contact.info.responseTime': 'We usually respond within 2-3 business days. Complex issues may take longer.',
  'contact.info.faq': 'For common questions, please see the FAQ page.',
  // About page
  'about.hero.line1': 'Travel',
  'about.hero.line2': 'Planning',
  'about.hero.line3': 'Simplified',
  'about.intro': 'Caglla makes travel planning beautiful and simple. We turn complex itinerary management into intuitive tools anyone can use.',
  'about.story.title': 'Our Story',
  'about.story.p1': 'In 2024, we were overwhelmed by the complexity of travel planning — too many apps, scattered notes, paper maps.',
  'about.story.p2': '“If only we had a tool that makes trip planning simpler and more beautiful.”',
  'about.story.p3': 'That idea gave birth to Caglla. Seamless with Google Maps, manage daily itineraries, stays, restaurants, and sights — all in one place, shared in real time.',
  'about.mission.title': 'Our Mission & Values',
  'about.mission.simplicity.title': 'Simplicity First',
  'about.mission.simplicity.text': 'We prioritize intuitive design over complexity. Trip planning should be fun.',
  'about.mission.collab.title': 'Collaboration',
  'about.mission.collab.text': 'Travel is rarely solo. We make team planning effortless.',
  'about.mission.security.title': 'Privacy & Security',
  'about.mission.security.text': 'Your travel data matters. We protect it with top-tier security.',
  'about.building.title': "What We're Building",
  'about.building.item1.title': 'Detailed itinerary management',
  'about.building.item1.text': 'Manage schedules by day and hour, stays, restaurants, and sights, all in one place.',
  'about.building.item2.title': 'Google Maps integration',
  'about.building.item2.text': 'Plan optimal routes visually on the map with auto distances and times.',
  'about.building.item3.title': 'Real-time sharing',
  'about.building.item3.text': 'Share and co-edit with family and friends to craft the best trip together.',
  'about.stats.year': 'Founded',
  'about.stats.possibility': 'Possibilities',
  'about.stats.passion': 'Built with passion',
  'about.cta.title': 'Join Us on This Journey',
  'about.cta.subtitle': 'Let’s create the future of trip planning together.',
  'about.cta.contact': 'Contact',
  'about.cta.getStarted': 'Get Started',
  // Terms page
  'terms.title': 'Terms of Service',
  'terms.updated': 'Last updated',
  'terms.s1.title': '1. Introduction',
  'terms.s1.p1': 'These Terms govern your use of Caglla Travel Manager. Please read and agree before using the service.',
  'terms.s2.title': '2. Service Description',
  'terms.s2.intro': 'The service provides the following features:',
  'terms.s2.li1': 'Create and manage travel plans',
  'terms.s2.li2': 'Manage itineraries',
  'terms.s2.li3': 'Search and register places and stays',
  'terms.s2.li4': 'Map display and route optimization',
  'terms.s2.li5': 'Manage reservations',
  'terms.s3.title': '3. Conditions of Use',
  'terms.s3.intro': 'Users must meet the following conditions:',
  'terms.s3.li1': 'Google account authentication',
  'terms.s3.li2': 'Agreement to these Terms',
  'terms.s3.li3': 'Use for proper purposes',
  'terms.s3.li4': 'Comply with laws and public order',
  'terms.s4.title': '4. Prohibited Actions',
  'terms.s4.intro': 'The following are prohibited:',
  'terms.s4.li1': 'Posting illegal or harmful content',
  'terms.s4.li2': 'Infringing other users’ rights',
  'terms.s4.li3': 'Disrupting normal operation',
  'terms.s4.li4': 'Unauthorized access or hacking',
  'terms.s4.li5': 'Other actions deemed inappropriate',
  'terms.s5.title': '5. Disclaimer',
  'terms.s5.p1': 'We are not liable for damages arising from use, except in cases of intent or gross negligence. The same applies to interruptions or termination.',
  'terms.s6.title': '6. Changes to Terms',
  'terms.s6.p1': 'We may change these Terms as needed. Changes take effect when posted in the service.',
  'terms.s7.title': '7. Contact',
  'terms.s7.p1': 'For questions about these Terms, please contact us via the Contact page.',
  'terms.s7.contact': 'Contact Page',
  // Docs page
  'docs.title1': 'Documentation',
  'docs.title2': 'Guides & Specs',
  'docs.intro': 'Find usage, specifications, and best practices for Caglla here.',
  'docs.search.title': 'Search',
  'docs.search.placeholder': 'Search guides (e.g., Itinerary, Maps, Environment)',
  'docs.guides.title': 'Guides',
  'docs.shortcuts.title': 'Shortcuts',
  'docs.shortcuts.support': 'Support',
  'docs.shortcuts.support.sub': 'Go to Help Center',
  'docs.shortcuts.faq': 'FAQ',
  'docs.shortcuts.faq.sub': 'Frequently Asked Questions',
  'docs.shortcuts.releases': 'Release Notes',
  'docs.shortcuts.releases.sub': 'Version history',
  'docs.cta.title': 'Couldn’t find it in the guides?',
  'docs.cta.subtitle': 'Check Support or FAQ, or contact us if needed.',
  'docs.cta.support': 'Go to Support',
  'docs.cta.faq': 'View FAQ',
  'docs.empty': 'No matching guides were found.',
  // Blog list page
  'blog.title1': 'Blog',
  'blog.title2': 'News & Updates',
  'blog.intro': 'Product updates, behind-the-scenes, and usage tips.',
  'blog.search.title': 'Search',
  'blog.search.placeholder': 'Search posts (e.g., Support, Roadmap, Updates)',
  'blog.latest': 'Latest Posts',
  'blog.empty': 'No matching posts were found.',
  'blog.cta.title': "Don't miss the latest",
  'blog.cta.subtitle': 'Also check Support, Docs, and FAQ.',
  'blog.cta.support': 'Go to Support',
  'blog.cta.docs': 'View Documentation',
  // Blog post page
  'blog.post.notfound.title': 'Post not found',
  'blog.post.notfound.desc': 'Check the URL or go back to the blog list.',
  'blog.post.back': '← Back to blog list',
  // Home (Top) page
  'home.hero.line1': 'Travel',
  'home.hero.line2': 'Planning',
  'home.hero.line3': 'Simplified',
  'home.intro': 'Manage detailed itineraries, stays and sights in one place. Beautiful and simple with Google Maps.',
  'home.cta.primary.title': 'Get Started',
  'home.cta.primary.button': 'Continue with Google',
  'home.cta.primary.seeFeatures': 'See features',
  'home.features.title': 'Features',
  'home.features.card1.title': 'Detailed planning',
  'home.features.card1.text': 'Manage daily plans, stays and spots together.',
  'home.features.card2.title': 'Team sharing',
  'home.features.card2.text': 'Co-edit and share with family and friends in real time.',
  'home.features.card3.title': 'Access anywhere',
  'home.features.card3.text': 'Looks beautiful on every device.',
  'home.cta.bottom.title': "Let's start now",
  'home.cta.bottom.subtitle': 'Try for free. Upgrade anytime.',
  'home.cookie.title': 'About cookies',
  'home.cookie.text': 'We use cookies for service delivery and analytics. By using this site, you agree to our use of cookies.',
  'home.cookie.more': 'Learn more',
  'home.cookie.reject': 'Reject',
  'home.cookie.accept': 'Accept',
  // Home Dashboard page (/home)
  'home.dashboard.recentlyChecked.title': 'Recently Checked Trips',
  'home.dashboard.recentlyChecked.empty': 'No recently checked trips',
  'home.dashboard.recentlyChecked.planned': '(To be implemented)',
  'home.dashboard.memories.title': 'Memories',
  'home.dashboard.memories.count': '{count} trips',
  'home.dashboard.memories.viewAll': 'View All Memories',
  'home.dashboard.upcomingTrips.title': 'Upcoming',
  'home.dashboard.upcomingTrips.count': '{count} trips',
  'home.dashboard.upcomingTrips.viewAll': 'View All Trip Plans',
  'home.dashboard.upcomingTrips.empty': 'No upcoming trips',
  'home.dashboard.upcomingTrips.today': 'Today',
  'home.dashboard.ongoingTrips.title': 'Ongoing',
  'home.dashboard.ongoingTrips.subtitle': 'Showing up to 3 trips',
  'home.dashboard.ongoingTrips.more': 'More',
  'home.dashboard.ongoingTrips.empty': 'No ongoing trips',
  'home.dashboard.ongoingTrips.createNew': 'Create New',
  'home.dashboard.ongoingTrips.period': 'Period',
  'home.dashboard.ongoingTrips.remainingDays': 'Remaining Days',
  'home.dashboard.ongoingTrips.untilToday': 'Until today',
  'home.dashboard.countryStats.title': 'Country Statistics',
  'home.dashboard.countryStats.summary': '{totalTrips} trips • {totalCountries} countries',
  'home.dashboard.countryStats.times': 'times',
  'home.dashboard.countryStats.empty': 'No trips yet',
  'home.dashboard.countryStats.error': 'An error occurred',
  'home.dashboard.countryStats.retry': 'Retry',
  'home.dashboard.countryStats.viewDetails': 'View Details →',
  'home.dashboard.planInfo.error': 'Failed to retrieve plan information',
  'home.dashboard.planInfo.tripLimit': 'Trip Limit',
  'home.dashboard.planInfo.tripLimitCount': '{count} / {max} trips',
  'home.dashboard.planInfo.changePlan': 'Change Plan',
  'home.dashboard.nextTrip.title': 'Next Trip Plan',
  'home.dashboard.nextTrip.createNew': 'Create New Trip',
  'home.dashboard.nextTrip.create': 'Create Trip',
  'home.dashboard.nextTrip.description': 'Check out your next adventure',
  'home.dashboard.nextTrip.createDescription': 'Start planning your amazing adventure',
  'home.dashboard.nextTrip.empty.title': 'No trips yet',
  'home.dashboard.nextTrip.empty.description': 'Create your first trip and start your amazing adventure!',
  'home.dashboard.nextTrip.empty.mapPlaceholder': 'Trip Map',
  'home.dashboard.nextTrip.empty.mapDescription': 'The map will be displayed when you create a trip',
  'home.dashboard.storage.title': 'Storage Usage',
  'home.dashboard.storage.inUse': '{percentage}% in use',
  'home.dashboard.storage.files': 'files',
  'home.dashboard.storage.fetchError': 'Failed to fetch storage usage',
  'home.dashboard.storage.deleteError': 'Failed to delete file',
  'home.dashboard.storage.retry': 'Retry',
  'home.dashboard.storage.details.title': 'Plan Details',
  'home.dashboard.storage.details.warning': 'Storage usage exceeds {percentage}%',
  'home.dashboard.storage.details.upgradeSuggestion': ' Consider upgrading your plan.',
  'home.dashboard.storage.details.limitReached': 'Storage limit reached. Delete files or upgrade your plan.',
  'home.dashboard.storage.details.history': 'Upload History',
  'home.dashboard.storage.details.fileName': 'File Name',
  'home.dashboard.storage.details.size': 'Size',
  'home.dashboard.storage.details.type': 'Type',
  'home.dashboard.storage.details.dateTime': 'Date/Time',
  'home.dashboard.storage.details.action': 'Action',
  'home.dashboard.storage.details.avatar': 'Avatar',
  'home.dashboard.storage.details.tripImage': 'Trip Image',
  'home.dashboard.storage.details.deleting': 'Deleting...',
  'home.dashboard.storage.details.delete': 'Delete',
  'home.dashboard.storage.details.refresh': 'Refresh Data',
  // Home Dashboard header row (/home welcome section)
  'home.welcome.title': 'Welcome',
  'home.welcome.subtitle': 'Discover and manage your travels',
  'home.welcome.createTrip': 'Create Trip',
  'home.welcome.quickPlan': 'Quick Plan',
  'home.welcome.createGuide': 'Create a Guide',
  // Home Dashboard main tabs (/home left column)
  'home.mainTabs.shares': 'My Shares',
  // Profile page
  'profile.back': '← Back',
  'profile.title': 'Profile',
  'profile.setup': 'Profile Setup',
  'profile.edit': 'Edit',
  'profile.cancel': 'Cancel',
  'profile.loading': 'Loading...',
  'profile.setupBanner.title': 'Complete your profile!',
  'profile.setupBanner.description': 'Tell us about yourself. It will be easier to connect with other users.',
  'profile.name': 'Name',
  'profile.bio': 'Self-introduction',
  'profile.bio.placeholder': 'Tell us about yourself...',
  'profile.bio.empty': 'Please add self-introduction',
  'profile.residenceArea': 'Residence Area',
  'profile.residenceArea.placeholder': 'Search residence area (e.g., Shibuya, Tokyo, San Jose, CA)',
  'profile.residenceArea.warning': '⚠️ Please select your residence area from Google Places for accurate country information',
  'profile.estimatedCountry': 'Estimated Country of Residence:',
  'profile.gender': 'Gender',
  'profile.gender.preferNotToSay': 'Prefer not to say',
  'profile.gender.male': 'Male',
  'profile.gender.female': 'Female',
  'profile.gender.other': 'Other',
  'profile.language': 'Language Settings',
  'profile.language.auto': 'Auto (Browser Settings)',
  'profile.language.description': 'Affects the language of location search results. If not selected, the browser language settings will be used.',
  'profile.save': 'Save',
  'profile.saving': 'Saving...',
  'profile.complete': 'Complete Profile',
  'profile.skip': 'Skip',
  'profile.image.title': 'Profile Image',
  'profile.image.change': 'Change Image',
  'profile.image.upload': 'Upload Image',
  'profile.image.uploading': 'Uploading...',
  'profile.image.formats': 'JPEG, PNG, WebP format (5MB or less)',
  'profile.image.alt': 'Profile image',
  'profile.image.invalid': 'Invalid file',
  'profile.image.uploadFailed': 'Failed to upload image',
  'profile.image.unknownError': 'Unknown error',
  'profile.image.deleteFailed': 'Failed to delete image',
  'profile.publicTrips.title': 'Public Trips',
  'profile.publicTrips.empty': 'No public trips yet',
  'profile.publicTrips.empty.description': 'Create trips and share them with other users!',
  'profile.privateTrips.title': 'Private Trips',
  'profile.privateTrips.empty': 'No private trips yet',
  'profile.privateTrips.empty.description': 'Private trips are only visible to you.',
  'profile.stats.title': 'Trip Statistics',
  'profile.stats.totalTrips': 'Total Trips',
  'profile.stats.totalCountries': 'Countries Visited',
  'profile.stats.countries.title': 'Top Countries',
  'profile.stats.times': 'times',
  'profile.stats.countries.more': 'and {count} more countries',
  // iCal Publish Modal
  'ical.title': 'iCal Publishing Settings',
  'ical.close': 'Close',
  'ical.closeButton': 'Close',
  'ical.premiumFeature': 'Premium Feature',
  'ical.premiumFeatureDescription': 'iCal publishing is available with Backpacker plan or higher.',
  'ical.about.title': 'About iCal Publishing',
  'ical.about.li1': 'Can be imported into calendar apps like Google Calendar, Apple Calendar, etc.',
  'ical.about.li2': 'Calendar apps will automatically update periodically',
  'ical.about.li3': 'Anyone with the URL can access it',
  'ical.about.li4': 'Can be disabled at any time',
  'ical.enabled': 'iCal Publishing Enabled',
  'ical.disable': 'Disable',
  'ical.tripUrl': 'Full Trip iCal URL',
  'ical.reservationsUrl': 'Reservations Only iCal URL',
  'ical.copy': 'Copy',
  'ical.copied': 'Copied',
  'ical.addToCalendar.title': 'How to Add to Calendar Apps',
  'ical.addToCalendar.google': 'Google Calendar: "Other calendars" → "Add by URL" → Paste URL',
  'ical.addToCalendar.apple': 'Apple Calendar: "File" → "New Calendar Subscription" → Paste URL',
  'ical.addToCalendar.outlook': 'Outlook: "Add calendar" → "Subscribe from web" → Paste URL',
  'ical.disabled': 'iCal publishing is disabled',
  'ical.enabling': 'Enabling...',
  'ical.enable': 'Enable iCal Publishing',
  'ical.enableError': 'Failed to enable iCal publishing',
  'ical.disableConfirm': 'Disable iCal publishing? External calendar apps will no longer be able to access it.',
  'ical.disableError': 'Failed to disable iCal publishing',
  'ical.planRequired': 'iCal publishing is available with Backpacker plan or higher',
  // Trip Itinerary Page
  'trip.calendarPublish': 'Calendar Publish',
  'trip.itinerary': 'Itinerary',
  'trip.schedule.time': 'Time',
  'trip.schedule.cost': 'Cost',
  'trip.schedule.reservation': 'Reservation',
  'trip.schedule.activity': 'Activity',
  'trip.schedule.categorySelect': 'Select Activity',
  'trip.schedule.categoryDetail': 'Select Detail',
  'trip.schedule.clear': 'Clear',
  'trip.schedule.selected': 'Selected',
  'trip.schedule.saveFailed': 'Failed to save schedule',
  'subscription.error': 'An error occurred while processing subscription',
  'trip.routeOptimization.title': 'Route Optimization',
  'trip.routeOptimization.button': 'Route Optimization',
  'trip.routeOptimization.optimizing': 'Optimizing...',
  'trip.routeOptimization.needTwoOrMore': 'Route optimization requires 2 or more locations',
  'trip.routeOptimization.failed': 'Route optimization failed',
  'trip.routeOptimization.error': 'An error occurred during route optimization',
  'trip.routeOptimization.calculatePlaces': 'Calculate optimal route for {count} places',
  'trip.routeOptimization.optimizedOrder': 'Optimized Visit Order',
  'trip.routeOptimization.apply': 'Apply this order',
  'trip.routeOptimization.cancel': 'Cancel',
  'trip.routeOptimization.applyFailed': 'Failed to apply optimization',
  'trip.itineraryView.title': 'Itinerary',
  'trip.itineraryView.addDay': 'Add Day',
  'trip.itineraryView.expandAll': 'Expand All',
  'trip.itineraryView.collapseAll': 'Collapse All',
  'trip.itineraryView.empty.title': 'No days added yet',
  'trip.itineraryView.empty.description': 'Add days to plan your trip',
  // Day Editor
  'dayEditor.placeholder': 'What are you doing today?',
  'dayEditor.saving': 'Saving...',
  'dayEditor.editHint': 'Enter for new line, Escape to cancel, click elsewhere to save',
  'dayEditor.clickToEdit': 'Click to edit',
  'dayEditor.updateError': 'Failed to update day description',
  'dayEditor.noDescription': 'No description',
  'dayEditor.deleteDay': 'Delete this day',
  'dayEditor.deleteConfirm': 'Are you sure you want to delete this day?',
  'dayEditor.deleteConfirmWithItineraries': 'This day has itineraries. Deleting will also remove all associated itineraries. Are you sure?',
  'dayEditor.deleteError': 'Failed to delete day',
  // Navigation Menu
  'nav.weatherForecast': 'Weather Forecast',
  'nav.reservation': 'Reservation',
  'nav.reservationTitle': 'Reservation',
  'nav.travelCost': 'Travel Cost',
  'nav.budgetTitle': 'Budget',
  'nav.activityStats': 'Activity Statistics',
  'nav.activityStatisticsTitle': 'Activity Statistics',
  'nav.totalDistance': 'Total Distance',
  'nav.distancesTitle': 'Distances',
  'nav.schedule': 'Schedule',
  // POI Dialog
  'poi.website': 'Website',
  'poi.cached': 'Cached',
  'poi.loading': 'Loading...',
  'poi.loadingInfo': 'Loading POI information...',
  'poi.photoOf': 'Photo of {name}',
  'poi.fetchDetailsError': 'Failed to fetch POI details',
  'poi.fetchError': 'Failed to fetch POI information',
  'poi.imageCacheError': 'Failed to cache image',
  'poi.errorMessage': 'An error occurred while fetching POI information',
  'poi.addToItinerary': 'Add to itinerary',
  'poi.showPartial': 'Show partial',
  'poi.showAll': 'Show all ({count})',
  'poi.reviewsAndTips': 'Reviews・Tips',
  'poi.helpfulVotes': '{count} people found this helpful',
  'poi.reviewCount': '{count} reviews',
  'poi.daySelector.title': 'Select day to add',
  'poi.openingHours.open': 'Open',
  'poi.openingHours.closed': 'Closed',
  'poi.openingHours.openingSoon': 'Opening soon',
  'poi.openingHours.open24h': 'Open 24 hours',
  'poi.openingHours.closedDay': 'Closed',
  'poi.businessStatus.temporarilyClosed': 'Temporarily closed',
  'poi.businessStatus.permanentlyClosed': 'Permanently closed',
  'poi.weekday.sunday': 'Sun',
  'poi.weekday.monday': 'Mon',
  'poi.weekday.tuesday': 'Tue',
  'poi.weekday.wednesday': 'Wed',
  'poi.weekday.thursday': 'Thu',
  'poi.weekday.friday': 'Fri',
  'poi.weekday.saturday': 'Sat',
  'poi.weekday.sundayShort': 'Su',
  'poi.weekday.mondayShort': 'Mo',
  'poi.weekday.tuesdayShort': 'Tu',
  'poi.weekday.wednesdayShort': 'We',
  'poi.weekday.thursdayShort': 'Th',
  'poi.weekday.fridayShort': 'Fr',
  'poi.weekday.saturdayShort': 'Sa',
  // Reservation Display
  'reservation.title': 'Reservations',
  'reservation.empty': 'No reservations',
  'reservation.empty.description': 'Add reservation information to your Itinerary',
  'reservation.count': ' items',
  'reservation.timeRange': '-',
  // Activity Analysis Display
  'activity.analysis.empty': 'No activity tags have been set.',
  'activity.analysis.empty.description': 'Add activity tags to your itinerary to see statistics here.',
  'activity.analysis.total': 'Total Activities',
  'activity.analysis.categoryDistribution': 'Distribution by Category',
  'activity.analysis.detailsTop5': 'Detailed Activities Top 5',
  'activity.analysis.times': ' times',
  // Distance Display
  'distance.title': 'Total Distance',
  'distance.loading': 'Calculating total distance...',
  'distance.error.calculationFailed': 'Distance calculation failed',
  'distance.error.totalCalculationFailed': 'Total distance calculation failed',
  'distance.empty.noPlaces': 'No schedules with location information',
  'distance.empty.needTwoOrMore': 'At least 2 schedules with location information are required to calculate distance',
  'distance.empty.description': 'Add locations to your schedules to display total distance',
  'distance.visitedPlaces': 'Visited Places',
  'distance.total': 'Total Distance',
  'distance.totalTime': 'Total Time',
  'distance.average': 'Average Distance',
  'distance.averageTime': 'Average Time',
  'distance.perSegment': '/segment',
  'distance.perTimeSegment': ' min/segment',
  'distance.hint.details': 'You can check detailed distance and time between venues in the schedule',
  'distance.openTransit': 'Open in Google Transit',
  'distance.openTransitUnavailable': 'Transit link unavailable (missing location information)',
  // Navigation
  'nav.summary': 'Summary',
  'nav.itinerary': 'Itinerary',
  'nav.checklist': 'Checklist',
  'nav.plan': 'Plan',
  'nav.profile': 'Profile',
  'nav.logout': 'Logout',
  'nav.dayPrefix': 'Day',
  'nav.dayAbbr': 'DAY',
  // Common
  'common.close': 'Close',
  'common.deleteFailed': 'Failed to delete',
  'common.deleteError': 'An error occurred while deleting',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.saving': 'Saving...',
  'common.delete': 'Delete',
  'common.retry': 'Retry',
  'common.goHome': 'Go back home',
  // Admin / Dev Tools
  'admin.logs.timezone.deleteConfirm': 'Delete all timezone failure logs?',
  'admin.logs.currency.deleteConfirm': 'Delete all currency failure logs?',
  'admin.logs.deleteAllConfirm': 'Delete all logs?',
  'admin.logs.timezone.processed': 'Processed {count} timezone logs.',
  'admin.logs.currency.processed': 'Processed {count} currency logs.',
  'admin.logs.mapping.updated': 'Processed {processedCount} logs and updated {updateCount} mappings.',
  'admin.logs.insufficientLogs': 'Insufficient logs to process (less than 50).',
  'admin.logs.batchFailed': 'Batch processing failed.',
  // Schedule
  'schedule.time.updateFailed': 'Failed to update time',
  'schedule.cost.updateFailed': 'Failed to update cost',
  // Export Data Modal
  'export.error': 'An error occurred while exporting',
  'export.description.trip.json': 'Export all trip data (trip information, days, Itinerary, reservations) in JSON format.',
  'export.description.trip.csv': 'Export all Itinerary items in CSV format. Can be edited in Excel, etc.',
  'export.description.trip.ical': 'Export all Itinerary items in iCalendar format. Can be imported into Google Calendar, Apple Calendar, etc.',
  'export.description.reservation.json': 'Export only reservation information in JSON format.',
  'export.description.reservation.csv': 'Export only reservation information in CSV format. Can be edited in Excel, etc.',
  'export.description.reservation.ical': 'Export only reservation information in iCalendar format. Can be imported into calendar apps for scheduling and notification settings.',
  // Subscription Modal
  'subscription.processing': 'Processing...',
  'subscription.startNow': 'Start now',
  // Place Search Input
  'placeSearch.placeholder': 'Search for a place...',
  'placeSearch.searchFailed': 'Failed to search for places',
  'placeSearch.detailsFailed': 'Failed to fetch place details',
  'placeSearch.selectFailed': 'Failed to select place',
  'placeSearch.noResults': 'No places found',
  // Common UI
  'common.dragHandle': 'Drag to reorder',
  'common.openMenu': 'Open menu',
  'schedule.addVenueBetween': 'Add venue between',
  // Checklist
  'checklist.addItem': 'Add item',
  // Route Optimization
  'routeOptimization.failed': 'Route optimization failed',
  'routeOptimization.optimizedRoute': 'Optimized route',
  'routeOptimization.loading': 'Optimizing route...',
  'routeOptimization.noResult': 'No optimization result',
  'routeOptimization.totalDistance': 'Total distance',
  'routeOptimization.totalDuration': 'Total duration',
  'routeOptimization.optimizedOrder': 'Optimized order',
  'routeOptimization.apiCost': 'API cost',
  'routeOptimization.insufficientWaypoints': 'Route optimization requires at least 2 waypoints',
  'routeCost.failed': 'Failed to fetch cost estimate',
  'routeCost.suggestion': 'Cost reduction suggestions:',
  'routeCost.label': 'Route optimization cost:',
  'routeCost.waypoints': '{waypointCount} waypoints → {requestsNeeded} API calls',
  // Trip Itinerary View
  'tripItinerary.invalidDate': 'Invalid date',
  'tripItinerary.dateNotSet': 'Date not set',
  'tripItinerary.expand': 'Expand',
  'tripItinerary.collapse': 'Collapse',
  'tripItinerary.addVenue': 'Add venue',
  'tripItinerary.addVenueAtEnd': 'Add venue at end',
  // Schedule Card
  'scheduleCard.reservationSaveFailed': 'Failed to save reservation information',
  'scheduleCard.collapse': 'Collapse',
  'scheduleCard.readMore': 'Read more',
  'scheduleCard.memo.hasDescription': 'Memo: Place description is displayed. Click to edit.',
  'scheduleCard.memo.addMemo': 'Memo: Add a memo',
  // Trip Editor
  'tripEditor.dateValidation': 'Start date must be before end date',
  'tripEditor.destinationPlaceholder': 'Search for destination (e.g., Tokyo, Paris, New York)',
  'tripEditor.title': 'Edit trip information',
  'tripEditor.destinationReSelectHint': 'Please re-select the destination from Google Places for accurate country information',
  'tripEditor.accessLevel.private': 'Private — personal plan shared only with invited buddies',
  'tripEditor.accessLevel.public': 'Public — showcase for anyone to explore',
  'tripEditor.field.publishStatus': 'Publish Status',
  'tripEditor.publishStatus.draft': 'Draft — work in progress',
  'tripEditor.publishStatus.published': 'Published — visible to everyone',
  'tripEditor.field.title': 'Trip Title *',
  'tripEditor.field.description': 'Description',
  'tripEditor.field.startDate': 'Departure Date',
  'tripEditor.field.endDate': 'Return Date',
  'tripEditor.field.accessLevel': 'Privacy Settings',
  'tripEditor.field.image': 'Trip Image',
  'tripEditor.field.destination': 'Destination',
  'tripEditor.field.defaultCurrency': 'Default Currency',
  'tripEditor.field.defaultCurrency.hint': 'This currency will be used as the default for new itinerary items',
  'tripEditor.currency.major': 'Major Currencies',
  'tripEditor.currency.others': 'Other Currencies',
  'tripEditor.deleteConfirm.title': 'Delete trip?',
  'tripEditor.deleteConfirm.message': 'Delete "{title}". This action cannot be undone.',
  'tripEditor.deleteConfirm.deleting': 'Deleting...',
  // Image Upload
  'imageUpload.invalidFile': 'Invalid file',
  'imageUpload.loginRequired': 'Login required',
  'imageUpload.userIdNotFound': 'User ID not found. Please log in again.',
  'imageUpload.userInfoNotFound': 'User information not found. Please log in again.',
  'imageUpload.avatar': 'Avatar Image',
  'imageUpload.uploadFailed': 'Failed to upload image: {error}',
  'imageUpload.unknownError': 'An unknown error occurred',
  'imageUpload.uploading': 'Uploading...',
  'imageUpload.selectAnother': 'Select another image',
  'imageUpload.dropHere': 'Drop image here',
  'imageUpload.clickOrDrag': 'Click or drag & drop to upload',
  'imageUpload.error.auth': 'Authentication error',
  'imageUpload.error.auth.description': 'No access permission to Firebase Storage',
  'imageUpload.error.canceled': 'Upload was canceled',
  'imageUpload.error.unknown': 'An unknown error occurred',
  'imageUpload.error.invalidArgument': 'Invalid argument',
  'imageUpload.error.invalidChecksum': 'File checksum is invalid',
  'imageUpload.error.invalidFormat': 'File format is invalid',
  'imageUpload.error.invalidName': 'File name is invalid',
  'imageUpload.error.objectNotFound': 'File not found',
  'imageUpload.error.projectNotFound': 'Firebase project not found',
  'imageUpload.error.quotaExceeded': 'Storage quota exceeded',
  'imageUpload.error.unauthenticated': 'Not authenticated',
  'imageUpload.error.uploadFailed': 'Failed to upload image',
  'imageUpload.error.storageQuotaExceeded': 'Storage quota exceeded: {error}',
  'imageUpload.error.quotaCheckFailed': 'Failed to check storage quota',
  'imageUpload.error.storageUsageUpdateFailed': 'Failed to update storage usage',
  // Timezone Log Manager
  'timezoneLog.showDetails': 'Show details',
  'timezoneLog.hideDetails': 'Hide details',
  // Schedule Card Menu
  'scheduleCardMenu.moveFailed': 'Failed to move schedule',
  'scheduleCardMenu.duplicateFailed': 'Failed to duplicate schedule',
  // Venue Distance
  'venueDistance.calculationFailed': 'Failed to calculate distance',
  // Country Map
  'countryMap.loadFailed': 'Failed to load map',
  // Daily Route Optimizer
  'routeOptimizer.unknownPlace': 'Unknown place',
  // Trip Map
  'tripMap.loadFailed': 'Failed to load Google Maps API',
  'tripMap.loadFailedWarning': '⚠️ Failed to load map',
  // Trip Map Overlay
  'tripMap.overlay.title': 'Itinerary Map',
  'tripMap.overlay.filtering': 'Filtering',
  'tripMap.overlay.displayingLocations': '{count} locations displayed',
  'tripMap.overlay.filteredByDay': 'Only selected dates are displayed',
  // Next Trip Map
  'nextTripMap.loadFailed': 'Failed to load Google Maps API',
  // Plan Limits Display
  'planLimits.currentPlan': 'Current plan',
  'planLimits.publicTemplate': 'Public templates',
  // Timezone Log Manager
  'timezoneLog.processed': 'Processed',
  'timezoneLog.latestBatchResults': 'Latest batch update results',
  'timezoneLog.aboutBatchProcessing': 'About batch processing',
  // Country Map
  'countryMap.tripCount': '{count} trips',
  // Inline Cost Editor
  'inlineCostEditor.amount': 'Amount',
  'inlineCostEditor.currency': 'Currency',
  'inlineCostEditor.invalidAmount': 'Please enter a valid amount',
  'inlineCostEditor.saveHint': 'Press Enter to save, Escape to cancel',
  'inlineCostEditor.saving': 'Saving...',
  // Inline Time Editor
  'inlineTimeEditor.startTime': 'Start Time',
  'inlineTimeEditor.endTime': 'End Time',
  'inlineTimeEditor.timezone': 'Timezone',
  'inlineTimeEditor.invalidFormat': 'Please enter a valid time format (e.g., 16:00)',
  'inlineTimeEditor.saveHint': 'Press Enter to save, Escape to cancel',
  'inlineTimeEditor.saving': 'Saving...',
  // Timezone Options
  'timezone.UTC': 'UTC',
  'timezone.japan_tokyo': 'Japan (Tokyo)',
  'timezone.america_new_york': 'United States (New York)',
  'timezone.america_los_angeles': 'United States (Los Angeles)',
  'timezone.europe_london': 'United Kingdom (London)',
  'timezone.europe_paris': 'France (Paris)',
  'timezone.asia_seoul': 'South Korea (Seoul)',
  'timezone.asia_shanghai': 'China (Shanghai)',
  'timezone.asia_hong_kong': 'Hong Kong',
  'timezone.asia_singapore': 'Singapore',
  'timezone.asia_bangkok': 'Thailand (Bangkok)',
  'timezone.asia_kolkata': 'India (Kolkata)',
  'timezone.australia_sydney': 'Australia (Sydney)',
  'timezone.pacific_honolulu': 'Hawaii (Honolulu)',
  'timezone.pacific_guam': 'Guam',
  'timezone.pacific_saipan': 'Saipan',
  // Add Schedule Modal
  'addScheduleModal.title': 'Add Venue / Point of Interest',
  'addScheduleModal.searchLabel': 'Search place',
  'addScheduleModal.searchPlaceholder': 'e.g., Tokyo Tower, Senso-ji Temple, Ginza...',
  'addScheduleModal.searchButton': 'Search',
  'addScheduleModal.searching': 'Searching...',
  'addScheduleModal.searchResults': 'Search Results',
  'addScheduleModal.tryDifferentKeyword': 'Try searching with different keywords',
  // User Settings Page
  'userSettingsPage.saveSuccess': 'Settings saved',
  'userSettingsPage.saveFailed': 'Failed to save settings',
  'userSettingsPage.saveButton': 'Save settings',
  'userSettingsPage.saving': 'Saving...',
  // Admin Failure Logs Page
  'adminFailureLogs.processed': 'Processed',
  'adminFailureLogs.aboutThisPage': 'About this page',
  // Country Stats
  'countryStats.noTrips': 'No trips yet',
  'countryStats.recommendedTrips': 'Recommended trip plans',
  // Recommended Trips
  'recommendedTrips.title': 'Recommended trip plans',
  // Premium Feature
  'premium.unlimitedTrips': 'Unlimited trip plans',
  'premium.allPremiumFeatures': 'All premium features',
  // Trip Slug Page
  'tripSlugPage.pdfRequiresBackpacker': 'PDF export requires Backpacker plan or higher',
  'tripSlugPage.pdfExportFailed': 'PDF export failed',
  'tripSlugPage.fetchTripFailed': 'Failed to fetch trip data',
  'tripSlugPage.fetchTripFailedDescription': 'Something went wrong while loading this trip. Please try again.',
  'tripSlugPage.notFoundDescription': 'We couldn\'t find this trip or you may not have access to it.',
  'tripSlugPage.addDayFailed': 'Failed to add day',
  'tripSlugPage.addPOIFailed': 'Failed to add POI',
  'tripSlugPage.orderUpdateFailed': 'Failed to update order',
  // Trip New Page
  'tripNew.dateValidation': 'Start date must be before end date',
  'tripNew.destinationRequired': 'Please enter destination',
  'tripNew.startDateRequired': 'Please select start date',
  'tripNew.endDateRequired': 'Please select end date',
  'tripNew.title': 'Create new trip',
  'tripNew.destinationPlaceholder': 'Search for destination...',
  'tripNew.titlePlaceholder': 'e.g., Okinawa trip (destination will be used if blank)',
  'tripNew.descriptionPlaceholder': 'Enter trip details and purpose',
  'tripNew.accessLevel.private': 'Private (only you and shared users)',
  'tripNew.accessLevel.public': 'Public (anyone can view)',
  'tripNew.createButton': 'Create trip',
  'tripNew.creating': 'Creating...',
  // Not Found Page
  'notFound.title': 'Page not found',
  // Image Gallery
  'gallery.previousImage': 'Previous image',
  'gallery.nextImage': 'Next image',
  'gallery.cached': 'Cached',
  'gallery.photosOf': '{name} photos',
  'gallery.photoCount': '+{count} photos',
  // Activity Categories (minimal set; fallback supported)
  'activity.primary.transportation': 'Mobility & Transport',
  'activity.primaryShort.transportation': 'Mobility',
  'activity.primary.shopping': 'Shopping',
  'activity.primaryShort.shopping': 'Shopping',
  'activity.primary.dining': 'Dining',
  'activity.primaryShort.dining': 'Dining',
  'activity.primary.accommodation': 'Accommodation',
  'activity.primaryShort.accommodation': 'Lodging',
  'activity.primary.exploration': 'Exploration',
  'activity.primaryShort.exploration': 'Explore',
  'activity.primary.adventure': 'Adventure',
  'activity.primaryShort.adventure': 'Adventure',
  'activity.primary.entertainment': 'Entertainment',
  'activity.primaryShort.entertainment': 'Play',
  'activity.primary.culture': 'Culture',
  'activity.primaryShort.culture': 'Culture',
  'activity.primary.wellness': 'Wellness',
  'activity.primaryShort.wellness': 'Health',
  'activity.primary.service': 'Service',
  'activity.primaryShort.service': 'Service',
  // Activity Secondary Categories - Transportation
  'activity.secondary.transportation.flight': 'Flight',
  'activity.secondary.transportation.flight.description': 'International/Domestic flights',
  'activity.secondary.transportation.train': 'Train',
  'activity.secondary.transportation.train.description': 'Railway/Subway transportation',
  'activity.secondary.transportation.bus': 'Bus',
  'activity.secondary.transportation.bus.description': 'Express bus/City bus',
  'activity.secondary.transportation.taxi': 'Taxi',
  'activity.secondary.transportation.taxi.description': 'Taxi/Ride-sharing service',
  'activity.secondary.transportation.car_rental': 'Rental Car',
  'activity.secondary.transportation.car_rental.description': 'Car rental transportation',
  'activity.secondary.transportation.personal_car': 'Personal Car',
  'activity.secondary.transportation.personal_car.description': 'Driving with your own car',
  'activity.secondary.transportation.parking': 'Parking',
  'activity.secondary.transportation.parking.description': 'Parking spot reservations and payment',
  'activity.secondary.transportation.ferry': 'Ferry',
  'activity.secondary.transportation.ferry.description': 'Ship/Ferry transportation',
  'activity.secondary.transportation.bike': 'Bicycle',
  'activity.secondary.transportation.bike.description': 'Rental bicycle',
  'activity.secondary.transportation.scooter': 'Motorcycle/Scooter',
  'activity.secondary.transportation.scooter.description': 'Motorcycle/Electric scooter',
  'activity.secondary.transportation.gas_station': 'Gas Station',
  'activity.secondary.transportation.gas_station.description': 'Refueling/Gas station',
  'activity.secondary.transportation.toll_payment': 'Toll Payment',
  'activity.secondary.transportation.toll_payment.description': 'Highway toll/Road toll payment',
  // Shopping
  'activity.secondary.shopping.souvenir': 'Souvenir Purchase',
  'activity.secondary.shopping.souvenir.description': 'Souvenir/Keepsake purchase',
  'activity.secondary.shopping.grocery': 'Grocery Shopping',
  'activity.secondary.shopping.grocery.description': 'Shopping at supermarket/Convenience store',
  'activity.secondary.shopping.fashion': 'Fashion',
  'activity.secondary.shopping.fashion.description': 'Clothing/Accessories purchase',
  'activity.secondary.shopping.electronics': 'Electronics',
  'activity.secondary.shopping.electronics.description': 'Home appliances/Gadgets purchase',
  'activity.secondary.shopping.local_market': 'Local Market',
  'activity.secondary.shopping.local_market.description': 'Local market/Bazaar',
  'activity.secondary.shopping.duty_free': 'Duty-free Shop',
  'activity.secondary.shopping.duty_free.description': 'Airport/City duty-free shop',
  'activity.secondary.shopping.bookstore': 'Bookstore',
  'activity.secondary.shopping.bookstore.description': 'Books/Magazines purchase',
  // Dining
  'activity.secondary.dining.breakfast': 'Breakfast',
  'activity.secondary.dining.breakfast.description': 'Hotel breakfast/Cafe breakfast',
  'activity.secondary.dining.lunch': 'Lunch',
  'activity.secondary.dining.lunch.description': 'Lunch/Light meal',
  'activity.secondary.dining.dinner': 'Dinner',
  'activity.secondary.dining.dinner.description': 'Dinner/Evening restaurant',
  'activity.secondary.dining.cafe': 'Cafe',
  'activity.secondary.dining.cafe.description': 'Cafe/Coffee shop',
  'activity.secondary.dining.bar': 'Bar',
  'activity.secondary.dining.bar.description': 'Bar/Pub',
  'activity.secondary.dining.food_tour': 'Food Tour',
  'activity.secondary.dining.food_tour.description': 'Food walking/Gourmet tour',
  'activity.secondary.dining.street_food': 'Street Food',
  'activity.secondary.dining.street_food.description': 'Food stall/Food truck',
  'activity.secondary.dining.fine_dining': 'Fine Dining',
  'activity.secondary.dining.fine_dining.description': 'Fine dining restaurant',
  // Accommodation
  'activity.secondary.accommodation.check_in': 'Check-in',
  'activity.secondary.accommodation.check_in.description': 'Hotel/Accommodation check-in',
  'activity.secondary.accommodation.check_out': 'Check-out',
  'activity.secondary.accommodation.check_out.description': 'Hotel/Accommodation check-out',
  'activity.secondary.accommodation.car_camping': 'Sleeping in Car',
  'activity.secondary.accommodation.car_camping.description': 'Sleeping in car',
  'activity.secondary.accommodation.camping': 'Camping',
  'activity.secondary.accommodation.camping.description': 'Tent/Campground accommodation',
  'activity.secondary.accommodation.hostel_stay': 'Hostel Stay',
  'activity.secondary.accommodation.hostel_stay.description': 'Hostel/Guesthouse',
  'activity.secondary.accommodation.airbnb': 'Private Lodging',
  'activity.secondary.accommodation.airbnb.description': 'Airbnb/Private lodging facility',
  'activity.secondary.accommodation.luxury_hotel': 'Luxury Hotel',
  'activity.secondary.accommodation.luxury_hotel.description': '5-star hotel/Resort',
  // Exploration
  'activity.secondary.exploration.city_walk': 'City Walk',
  'activity.secondary.exploration.city_walk.description': 'City/Town strolling',
  'activity.secondary.exploration.nature_walk': 'Nature Walk',
  'activity.secondary.exploration.nature_walk.description': 'Park/Nature walking',
  'activity.secondary.exploration.photography': 'Photography',
  'activity.secondary.exploration.photography.description': 'Landscape/Building photography',
  'activity.secondary.exploration.observation': 'Observation',
  'activity.secondary.exploration.observation.description': 'Observatory/Viewpoint enjoyment',
  'activity.secondary.exploration.architecture': 'Architecture',
  'activity.secondary.exploration.architecture.description': 'Building viewing',
  'activity.secondary.exploration.park': 'Park Visit',
  'activity.secondary.exploration.park.description': 'Park/Garden visit',
  // Adventure
  'activity.secondary.adventure.hiking': 'Hiking',
  'activity.secondary.adventure.hiking.description': 'Mountain trail/Trail hiking',
  'activity.secondary.adventure.trekking': 'Trekking',
  'activity.secondary.adventure.trekking.description': 'Mountain trekking',
  'activity.secondary.adventure.diving': 'Diving',
  'activity.secondary.adventure.diving.description': 'Scuba diving',
  'activity.secondary.adventure.snorkeling': 'Snorkeling',
  'activity.secondary.adventure.snorkeling.description': 'Snorkeling',
  'activity.secondary.adventure.rock_climbing': 'Rock Climbing',
  'activity.secondary.adventure.rock_climbing.description': 'Climbing/Bouldering',
  'activity.secondary.adventure.caving': 'Caving',
  'activity.secondary.adventure.caving.description': 'Cave/Caving',
  'activity.secondary.adventure.safari': 'Safari',
  'activity.secondary.adventure.safari.description': 'Safari tour/Wildlife observation',
  'activity.secondary.adventure.jungle_trek': 'Jungle Trek',
  'activity.secondary.adventure.jungle_trek.description': 'Jungle/Tropical rainforest exploration',
  // Entertainment
  'activity.secondary.entertainment.theme_park': 'Theme Park',
  'activity.secondary.entertainment.theme_park.description': 'Amusement park/Theme park',
  'activity.secondary.entertainment.beach': 'Beach',
  'activity.secondary.entertainment.beach.description': 'Beach/Beach activities',
  'activity.secondary.entertainment.water_sports': 'Water Sports',
  'activity.secondary.entertainment.water_sports.description': 'Surfing/Kayaking etc.',
  'activity.secondary.entertainment.casino': 'Casino',
  'activity.secondary.entertainment.casino.description': 'Casino/Gambling',
  'activity.secondary.entertainment.nightlife': 'Nightlife',
  'activity.secondary.entertainment.nightlife.description': 'Nightclub/Bar hopping',
  'activity.secondary.entertainment.game_center': 'Game Center',
  'activity.secondary.entertainment.game_center.description': 'Arcade/Game center',
  'activity.secondary.entertainment.karaoke': 'Karaoke',
  'activity.secondary.entertainment.karaoke.description': 'Karaoke/Singing',
  'activity.secondary.entertainment.movie': 'Movie',
  'activity.secondary.entertainment.movie.description': 'Movie theater/Cinema',
  // Culture
  'activity.secondary.culture.museum': 'Museum',
  'activity.secondary.culture.museum.description': 'Museum/Science museum',
  'activity.secondary.culture.art_gallery': 'Art Gallery',
  'activity.secondary.culture.art_gallery.description': 'Art museum/Gallery',
  'activity.secondary.culture.aquarium': 'Aquarium',
  'activity.secondary.culture.aquarium.description': 'Marine life exhibition/Education facility',
  'activity.secondary.culture.temple_shrine': 'Temple/Shrine',
  'activity.secondary.culture.temple_shrine.description': 'Temple/Shrine/Church',
  'activity.secondary.culture.historical_site': 'Historical Site',
  'activity.secondary.culture.historical_site.description': 'Castle/Ruins/Historic site',
  'activity.secondary.culture.local_festival': 'Local Festival',
  'activity.secondary.culture.local_festival.description': 'Festival/Event',
  'activity.secondary.culture.theater': 'Theater/Concert',
  'activity.secondary.culture.theater.description': 'Theater/Music concert',
  'activity.secondary.culture.traditional_experience': 'Traditional Experience',
  'activity.secondary.culture.traditional_experience.description': 'Tea ceremony/Calligraphy experience',
  'activity.secondary.culture.workshop': 'Workshop',
  'activity.secondary.culture.workshop.description': 'Craft/Art experience',
  // Wellness
  'activity.secondary.wellness.spa': 'Spa',
  'activity.secondary.wellness.spa.description': 'Spa/Hot spring',
  'activity.secondary.wellness.massage': 'Massage',
  'activity.secondary.wellness.massage.description': 'Massage/Relaxation',
  'activity.secondary.wellness.yoga': 'Yoga',
  'activity.secondary.wellness.yoga.description': 'Yoga/Meditation class',
  'activity.secondary.wellness.gym': 'Gym',
  'activity.secondary.wellness.gym.description': 'Fitness gym',
  'activity.secondary.wellness.meditation': 'Meditation',
  'activity.secondary.wellness.meditation.description': 'Meditation/Mindfulness',
  'activity.secondary.wellness.hot_spring': 'Hot Spring',
  'activity.secondary.wellness.hot_spring.description': 'Hot spring/Public bath',
  'activity.secondary.wellness.detox': 'Detox',
  'activity.secondary.wellness.detox.description': 'Detox/Fasting',
  // Service
  'activity.secondary.service.laundry': 'Laundry',
  'activity.secondary.service.laundry.description': 'Coin laundry/Dry cleaning',
  'activity.secondary.service.currency_exchange': 'Currency Exchange',
  'activity.secondary.service.currency_exchange.description': 'Exchange office/Bank',
  'activity.secondary.service.hospital': 'Hospital',
  'activity.secondary.service.hospital.description': 'Hospital/Clinic',
  'activity.secondary.service.visa_application': 'Visa Application',
  'activity.secondary.service.visa_application.description': 'Embassy/Visa center',
  'activity.secondary.service.sim_purchase': 'SIM Purchase',
  'activity.secondary.service.sim_purchase.description': 'SIM card/Communication service',
  'activity.secondary.service.post_office': 'Post Office',
  'activity.secondary.service.post_office.description': 'Post/Package shipping',
  'activity.secondary.service.atm': 'ATM',
  'activity.secondary.service.atm.description': 'Cash withdrawal',
  'activity.secondary.service.baggage_storage': 'Baggage Storage',
  'activity.secondary.service.baggage_storage.description': 'Coin locker/Baggage storage',
  // Currency Names
  'currency.JPY.name': 'Japanese Yen',
  'currency.JPY.country': 'Japan',
  'currency.USD.name': 'US Dollar',
  'currency.USD.country': 'United States',
  'currency.EUR.name': 'Euro',
  'currency.EUR.country': 'Europe',
  'currency.GBP.name': 'British Pound',
  'currency.GBP.country': 'United Kingdom',
  'currency.KRW.name': 'South Korean Won',
  'currency.KRW.country': 'South Korea',
  'currency.CNY.name': 'Chinese Yuan',
  'currency.CNY.country': 'China',
  'currency.HKD.name': 'Hong Kong Dollar',
  'currency.HKD.country': 'Hong Kong',
  'currency.SGD.name': 'Singapore Dollar',
  'currency.SGD.country': 'Singapore',
  'currency.THB.name': 'Thai Baht',
  'currency.THB.country': 'Thailand',
  'currency.TWD.name': 'New Taiwan Dollar',
  'currency.TWD.country': 'Taiwan',
  'currency.AUD.name': 'Australian Dollar',
  'currency.AUD.country': 'Australia',
  'currency.CAD.name': 'Canadian Dollar',
  'currency.CAD.country': 'Canada',
  'currency.CHF.name': 'Swiss Franc',
  'currency.CHF.country': 'Switzerland',
  'currency.INR.name': 'Indian Rupee',
  'currency.INR.country': 'India',
  'currency.MYR.name': 'Malaysian Ringgit',
  'currency.MYR.country': 'Malaysia',
  'currency.IDR.name': 'Indonesian Rupiah',
  'currency.IDR.country': 'Indonesia',
  'currency.PHP.name': 'Philippine Peso',
  'currency.PHP.country': 'Philippines',
  'currency.VND.name': 'Vietnamese Dong',
  'currency.VND.country': 'Vietnam',
  'currency.MXN.name': 'Mexican Peso',
  'currency.MXN.country': 'Mexico',
  'currency.SEK.name': 'Swedish Krona',
  'currency.SEK.country': 'Sweden',
  'currency.NOK.name': 'Norwegian Krone',
  'currency.NOK.country': 'Norway',
  'currency.DKK.name': 'Danish Krone',
  'currency.DKK.country': 'Denmark',
  'currency.PLN.name': 'Polish Zloty',
  'currency.PLN.country': 'Poland',
  'currency.CZK.name': 'Czech Koruna',
  'currency.CZK.country': 'Czech Republic',
  'currency.HUF.name': 'Hungarian Forint',
  'currency.HUF.country': 'Hungary',
  'currency.RUB.name': 'Russian Ruble',
  'currency.RUB.country': 'Russia',
  'currency.AED.name': 'UAE Dirham',
  'currency.AED.country': 'United Arab Emirates',
  'currency.SAR.name': 'Saudi Riyal',
  'currency.SAR.country': 'Saudi Arabia',
  'currency.ILS.name': 'Israeli Shekel',
  'currency.ILS.country': 'Israel',
  'currency.TRY.name': 'Turkish Lira',
  'currency.TRY.country': 'Turkey',
  'currency.ZAR.name': 'South African Rand',
  'currency.ZAR.country': 'South Africa',
  'currency.BRL.name': 'Brazilian Real',
  'currency.BRL.country': 'Brazil',
  'currency.ARS.name': 'Argentine Peso',
  'currency.ARS.country': 'Argentina',
  'currency.CLP.name': 'Chilean Peso',
  'currency.CLP.country': 'Chile',
  'currency.COP.name': 'Colombian Peso',
  'currency.COP.country': 'Colombia',
  'currency.PEN.name': 'Peruvian Sol',
  'currency.PEN.country': 'Peru',
  'currency.NZD.name': 'New Zealand Dollar',
  'currency.NZD.country': 'New Zealand',
  // Travel Cost Display
  'cost.title': 'Travel Cost',
  'cost.empty': 'No schedules with cost information',
  'cost.empty.description': 'Add costs to your schedules to display total cost',
  'cost.items': ' items',
  'cost.total': 'Total',
  'cost.hint.edit': 'Click on any schedule\'s cost to edit',
  'cost.viewDetails': 'View Details',
  'cost.collapse': 'Collapse',
  // Date formatting
  'date.notSet': 'Date not set',
  'date.daysLater': 'days later',
  'date.days': 'days',
  'date.dayTrip': 'day trip',
  'date.yearsAgo': 'years ago',
  'date.monthsAgo': 'months ago',
  'date.thisMonth': 'This month',
  'date.year': '',
  'date.month': '',
  // Weather Forecast
  'weather.title': 'Weather Forecast',
  'weather.loading': 'Fetching weather information...',
  'weather.error.fetchFailed': 'Failed to fetch weather information',
  'weather.error.notAvailable': 'Weather information could not be retrieved',
  'weather.empty.noData': 'Weather information could not be retrieved',
  'weather.empty.noDestination': 'Weather forecast will be displayed when you set the trip dates and destination',
  'weather.hint.forecastLimit': '💡 Weather forecast is only available for dates within 16 days',
  'weather.partialForecast': 'Partial forecast',
  'weather.constraint.title': 'Forecast period limitation',
  'weather.constraint.message': 'Weather forecast is only available for {forecastDays} days.',
  'weather.constraint.remainingDays': 'The remaining {remainingDays} days of your trip are not displayed.',
  'weather.rainyDays': 'Rainy days',
  'weather.averageWindSpeed': 'Average wind speed',
  'weather.average': 'Average',
  'weather.range': '-',
  'weather.days': 'days',
  'weather.only': 'only',
  'weather.unknown': 'Unknown',
  'weather.forecastedBy': 'Forecasted by Open-Meteo',
  // Units
  'unit.mm': 'mm',
  'unit.kmh': 'km/h',
  'unit.km': 'km',
  'unit.hour': 'h',
  'unit.minute': 'min',
  // Weather Codes (WMO Weather Interpretation Codes)
  'weather.code.0': 'Clear sky',
  'weather.code.1': 'Mainly clear',
  'weather.code.2': 'Partly cloudy',
  'weather.code.3': 'Overcast',
  'weather.code.45': 'Fog',
  'weather.code.48': 'Depositing rime fog',
  'weather.code.51': 'Light drizzle',
  'weather.code.53': 'Moderate drizzle',
  'weather.code.55': 'Dense drizzle',
  'weather.code.56': 'Light freezing drizzle',
  'weather.code.57': 'Dense freezing drizzle',
  'weather.code.61': 'Slight rain',
  'weather.code.63': 'Moderate rain',
  'weather.code.65': 'Heavy rain',
  'weather.code.66': 'Light freezing rain',
  'weather.code.67': 'Heavy freezing rain',
  'weather.code.71': 'Slight snow fall',
  'weather.code.73': 'Moderate snow fall',
  'weather.code.75': 'Heavy snow fall',
  'weather.code.77': 'Snow grains',
  'weather.code.80': 'Slight rain showers',
  'weather.code.81': 'Moderate rain showers',
  'weather.code.82': 'Violent rain showers',
  'weather.code.85': 'Slight snow showers',
  'weather.code.86': 'Heavy snow showers',
  'weather.code.95': 'Thunderstorm',
  'weather.code.96': 'Thunderstorm with slight hail',
  'weather.code.99': 'Thunderstorm with heavy hail',
  'date.day': '',
  // Create Trip Dialog
  'trip.create.title': 'Create New Trip',
  'trip.create.destination.label': 'Destination *',
  'trip.create.destination.placeholder': 'Search for a destination (e.g., Tokyo, Paris, New York)',
  'trip.create.destination.hint': 'Please select a destination from Google Places',
  'trip.create.startDate.label': 'Start Date *',
  'trip.create.endDate.label': 'End Date *',
  'trip.create.dateError': 'Date Error',
  'trip.create.dateValidation.startBeforeEnd': 'Start date must be before end date',
  'trip.create.dateAutoAdjusted': 'End date has been automatically adjusted to match the start date',
  'trip.create.advancedSettings': 'Advanced Settings',
  'trip.create.mode.label': 'What would you like to create?',
  'trip.create.mode.trip': 'Plan a private trip',
  'trip.create.mode.tripDescription': 'Set concrete dates and keep everything private until you decide to publish.',
  'trip.create.mode.template': 'Create a template',
  'trip.create.mode.templateDescription': 'Build a reusable itinerary without dates. Publish it later when it is ready.',
  'trip.create.mode.templateDescriptionLocked': 'Upgrade your plan to create public templates and share them with everyone.',
  'trip.create.mode.templateUpgradeHint': 'Upgrade required',
  'trip.create.visibilityNotice': 'Every trip starts in private mode. Publish it later when you are ready to share.',
  'trip.create.title.label': 'Trip Title (destination will be used if left blank)',
  'trip.create.title.placeholder': 'e.g., Okinawa Trip (destination will be used if left blank)',
  'trip.create.description.label': 'Description',
  'trip.create.description.placeholder': 'Enter trip details and purpose',
  'trip.create.imageLoading': 'Auto-fetching destination-related image...',
  'trip.create.imageLoaded': 'Destination-related image auto-fetched',
  'trip.create.accessLevel.label': 'Access Settings',
  'trip.create.accessLevel.private.label': 'Private (personal planning)',
  'trip.create.accessLevel.private.description': 'Use when you are creating your own trip. Only you and invited buddies can view it.',
  'trip.create.accessLevel.public.description': 'Use when you want to showcase the trip publicly and promote it to others.',
  'trip.create.templateMode.label': 'Use as public template',
  'trip.create.templateMode.description.active': 'Template mode hides travel dates and lets you specify only the number of days. Perfect for reusable showcase plans.',
  'trip.create.templateMode.description.inactive': 'Keep template mode off when you are planning your own trip with specific dates.',
  'trip.create.dayCount.label': 'Number of days',
  'trip.create.dayCount.placeholder': 'e.g. 5',
  'trip.create.dayCount.description': 'Enter how many days this template covers. You can adjust actual dates later when duplicating.',
  'trip.create.validation.dayCountRequired': 'Please enter the number of days for the template.',
  'trip.template.upgradeRequired': 'Upgrade to Backpacker or higher to publish templates.',
  'trip.template.replicate': 'Create My Trip from This Template',
  'trip.template.replicating': 'Copying...',
  'trip.template.replicateFailed': 'Failed to create a replica from this template.',
  'trip.template.replicateDialogTitle': 'Start from this template',
  'trip.template.replicateStartDateLabel': 'Choose a start date *',
  'trip.template.replicateDayCountSummary': '{{dayCount}}-day template. We will auto-fill your end date.',
  'trip.template.replicateEndDatePreview': 'End date will be set to {{endDate}} automatically.',
  'trip.template.replicateEndDateHint': 'Select a start date to calculate the end date automatically.',
  'trip.template.replicateStartDateError': 'Start date is required.',
  'trip.publish.button': 'Publish Trip',
  'trip.publish.templateButton': 'Publish Template',
  'trip.publish.publishing': 'Publishing...',
  'trip.publish.templatePublishing': 'Publishing template...',
  'trip.publish.success': 'Published successfully.',
  'trip.publish.failed': 'Failed to publish. Please try again.',
  'trip.likes.loading': 'Loading likes…',
  'trip.likes.button.like': 'Like this trip',
  'trip.likes.button.liked': 'Liked',
  'trip.likes.loginRequired': 'Sign in to like public trips.',
  'trip.likes.error': 'Failed to update like status. Please try again.',
  'trip.likes.count': '{{count}} likes',
  'trip.create.cancel': 'Cancel',
  'trip.create.submitting': 'Creating...',
  'trip.create.submit': 'Create Trip',
  'trip.create.validation.destinationRequired': 'Please select a destination. Search and select a location from Google Places.',
  'trip.create.validation.startDateRequired': 'Please select a start date.',
  'trip.create.validation.endDateRequired': 'Please select an end date.',
  'trip.create.startDate.placeholder': 'YYYY-MM-DD',
  'trip.create.startDate.hint': 'Example: 2024-12-25',
  'trip.create.endDate.placeholder': 'YYYY-MM-DD',
  'trip.create.endDate.hint': 'Example: 2024-12-31',
  // Checklist
  'checklist.title': 'Travel Checklist',
  'checklist.applyPreset': 'Apply Preset',
  'checklist.myPresets': 'My Presets',
  'checklist.saveAsPreset': 'Save as Preset',
  'checklist.regenerating': 'Regenerating...',
  'checklist.regenerate': 'Regenerate Checklist',
  'checklist.loading': 'Loading...',
  'checklist.preparing.title': 'Preparing',
  'checklist.preparing.subtitle': 'Preparing for activities',
  'checklist.packing.title': 'Packing',
  'checklist.packing.subtitle': 'Items to pack',
  'checklist.noItems': 'No items',
  'checklist.delete': 'Delete',
  'checklist.addCustom.placeholder': 'Add custom item',
  'checklist.addCustom.add': 'Add',
  'checklist.preset.saveSuccess': 'Preset saved successfully',
  'checklist.preset.applySuccess': 'Preset applied successfully',
  'checklist.preset.saveModal.title': 'Save Checklist as Preset',
  'checklist.preset.saveModal.titleLabel': 'Title',
  'checklist.preset.saveModal.titlePlaceholder': 'e.g., Winter Hokkaido Trip',
  'checklist.preset.saveModal.descriptionLabel': 'Description',
  'checklist.preset.saveModal.descriptionPlaceholder': 'e.g., Checklist for ski and hot spring trip',
  'checklist.preset.saveModal.tagsLabel': 'Tags (comma-separated)',
  'checklist.preset.saveModal.tagsPlaceholder': 'e.g., winter, hokkaido, skiing',
  'checklist.preset.saveModal.isPublic': 'Make public (available to other users)',
  'checklist.preset.saveModal.cancel': 'Cancel',
  'checklist.preset.saveModal.saving': 'Saving...',
  'checklist.preset.saveModal.save': 'Save',
  'checklist.preset.saveModal.titleRequired': 'Please enter a title',
  'checklist.preset.saveModal.saveFailed': 'Failed to save preset',
  'checklist.myPresets.title': 'My Presets',
  'checklist.myPresets.loading': 'Loading...',
  'checklist.myPresets.empty': 'No presets',
  'checklist.myPresets.public': 'Public',
  'checklist.myPresets.private': 'Private',
  'checklist.myPresets.usageCount': 'Usage count',
  'checklist.myPresets.itemsCount': ' items',
  'checklist.myPresets.delete': 'Delete',
  'checklist.myPresets.close': 'Close',
  'checklist.myPresets.deleteConfirm': 'Are you sure you want to delete this preset?',
  'checklist.myPresets.deleteFailed': 'Failed to delete',
  'checklist.library.title': 'Select Checklist Preset',
  'checklist.library.searchPlaceholder': 'Search by keyword, tag...',
  'checklist.library.sortPopular': 'Popular',
  'checklist.library.sortRecent': 'Recent',
  'checklist.library.loading': 'Loading...',
  'checklist.library.empty': 'No presets found',
  'checklist.library.apply': 'Apply',
  'checklist.library.close': 'Close',
  'checklist.library.applyFailed': 'Failed to apply preset',
  'checklist.nav.preparing.title': 'Preparing',
  'checklist.nav.preparing.subtitle': 'Preparing for activities',
  'checklist.nav.packing.title': 'Packing',
  'checklist.nav.packing.subtitle': 'Items to pack',
  // Loading messages
  'loading.message': 'Loading...',
  'loading.mapLoading': 'Loading map...',
  'loading.saving': 'Saving...',
  'loading.calculating': 'Calculating...',
  'loading.addingSchedule': 'Adding schedule...',
  'loading.updating': 'Saving...',
  'loading.updatingDescription': 'Updating itinerary',
  // Reservation Categories
  'reservation.type.flight': 'Flight',
  'reservation.type.rentalCar': 'Rental Car',
  'reservation.type.hotel': 'Hotel',
  'reservation.type.dining': 'Dining',
  'reservation.type.other': 'Other',
  'reservation.site.expedia': 'Expedia',
  'reservation.site.bookingCom': 'Booking.com',
  'reservation.site.agoda': 'Agoda',
  'reservation.site.trivago': 'Trivago',
  'reservation.site.airbnb': 'Airbnb',
  'reservation.site.kayak': 'Kayak',
  'reservation.site.skyscanner': 'Skyscanner',
  'reservation.site.tripadvisor': 'TripAdvisor',
  'reservation.site.opentable': 'OpenTable',
  'reservation.site.tabelog': 'Tabelog',
  'reservation.site.hotPepper': 'Hot Pepper',
  'reservation.site.ana': 'ANA',
  'reservation.site.jal': 'JAL',
  'reservation.site.rakutenTravel': 'Rakuten Travel',
  'reservation.site.jalan': 'Jalan',
  'reservation.site.other': 'Other',
  'reservation.selectSite': 'Please select',
  'reservation.notSet': 'Not set',
  'reservation.modal.editTitle': 'Edit Reservation',
  'reservation.modal.addTitle': 'Add Reservation',
  'reservation.modal.loadTemplate': 'Load from template',
  'reservation.modal.template': 'Template',
  'reservation.modal.saveAsTemplate': 'Save as Template',
  'reservation.validation.airportCode': 'Airport code must be 3 uppercase letters (e.g., NRT, HND)',
  'reservation.validation.flightNumber': 'Flight number must be airline code + numbers (e.g., ANA123, JAL456)',
  'reservation.validation.typeRequired': 'Reservation type is required',
  'reservation.validation.flightNumberRequired': 'Flight number is required',
  'reservation.validation.departureAirportRequired': 'Departure airport is required',
  'reservation.validation.arrivalAirportRequired': 'Arrival airport is required',
  'reservation.validation.departureDateRequired': 'Departure date & time is required',
  'reservation.validation.arrivalDateRequired': 'Arrival date & time is required',
  'reservation.validation.startDateRequired': 'Start date & time is required',
  'reservation.validation.endDateRequired': 'End date & time is required',
  'reservation.validation.reservationUrl': 'Reservation URL must start with https:// and be a valid URL',
  'reservation.validation.invalidStartOrEnd': 'Start or end date is invalid',
  'reservation.validation.endAfterStart': 'End date & time must be after the start date & time',
  'reservation.validation.invalidDepartureOrArrival': 'Departure or arrival date is invalid',
  'reservation.validation.arrivalAfterDeparture': 'Arrival date & time must be after the departure date & time',
  'reservation.field.type': 'Reservation Type',
  'reservation.field.flightNumber': 'Flight Number',
  'reservation.field.airline': 'Airline',
  'reservation.field.departureAirport': 'Departure Airport',
  'reservation.field.arrivalAirport': 'Arrival Airport',
  'reservation.field.departureDateTime': 'Departure Date & Time',
  'reservation.field.arrivalDateTime': 'Arrival Date & Time',
  'reservation.field.startDateTime': 'Start Date & Time',
  'reservation.field.endDateTime': 'End Date & Time',
  'reservation.field.confirmationNumber': 'Confirmation Number',
  'reservation.field.reservationSite': 'Reservation Site',
  'reservation.field.reservationUrl': 'Reservation Site URL',
  'reservation.field.notes': 'Notes',
  'reservation.placeholder.flightNumber': 'e.g., ANA123, JAL456',
  'reservation.placeholder.airline': 'e.g., ANA, JAL',
  'reservation.placeholder.departureAirport': 'e.g., NRT, HND',
  'reservation.placeholder.arrivalAirport': 'e.g., ITM, KIX',
  'reservation.placeholder.confirmationNumber': 'Confirmation Number',
  'reservation.placeholder.notes': 'Additional notes or information',
  'reservation.button.cancel': 'Cancel',
  'reservation.button.save': 'Save',
  'reservation.button.saving': 'Saving...',
  'reservation.action.openSite': 'Open reservation site',
  'reservation.template.deleteFailed': 'Failed to delete template',
  'reservation.template.deleteConfirm': 'Delete this template?',
  'reservation.template.createFailed': 'Failed to create template',
  'reservation.template.updateFailed': 'Failed to update template',
  'reservation.template.empty': 'No templates',
  'reservation.template.placeholder.name': 'e.g., My usual ANA flight',
  'reservation.template.placeholder.description': 'Purpose and features of this template',
  'reservation.template.placeholder.notes': 'Notes that will be auto-filled when using this template',
  'reservation.template.useButton': 'Use template',
  'reservation.saveFailed': 'Failed to save reservation information',
  'schedule.venue.deleteConfirm': 'Delete this venue?',
  'user.defaultName': 'User',
  'plan.seasonTraveler': 'Season Traveler',
  // User Settings Modal
  'userSettings.title': 'User Settings',
  'userSettings.basicInfo': 'Basic Information',
  'userSettings.settings': 'Settings',
  'userSettings.label.name': 'Name',
  'userSettings.label.email': 'Email Address',
  'userSettings.label.currency': 'Currency',
  'userSettings.label.homeArea': 'Home Area (Residence)',
  'userSettings.label.homeCountry': 'Home Country',
  'userSettings.label.unitSystem': 'Unit System',
  'userSettings.unitSystem.metric': 'Metric (Celsius, km/m)',
  'userSettings.unitSystem.imperial': 'Imperial (Fahrenheit, mi/ft)',
  'userSettings.description.unitSystem': 'Temperature and distance units will be automatically set based on your selection',
  'userSettings.label.timezone': 'Timezone',
  'userSettings.label.language': 'Language',
  'userSettings.label.theme': 'Theme',
  'userSettings.label.notifications': 'Receive notifications',
  'userSettings.placeholder.name': 'Enter your name',
  'userSettings.placeholder.currency': 'e.g., JPY, USD, EUR',
  'userSettings.placeholder.homeArea': 'Search for your city or area...',
  'userSettings.placeholder.timezone': 'e.g., Asia/Tokyo',
  'userSettings.placeholder.select': 'Please select',
  'userSettings.placeholder.languageAuto': 'Auto (Browser setting)',
  'userSettings.description.checkingSlug': 'Checking slug availability...',
  'userSettings.description.homeAreaCountryCode': 'The country code of the selected location will be automatically determined',
  'userSettings.description.homeCountry': 'Used to determine if a trip is international when generating checklists',
  'userSettings.description.language': 'If not selected, the browser language setting will be used',
  'userSettings.validation.nameMinLength': 'Name must be at least 4 characters',
  'userSettings.validation.nameAvailable': 'This name is available',
  'userSettings.validation.slugCheckFailed': 'Failed to check slug availability',
  'userSettings.validation.nameDuplicate': 'Please resolve the name duplicate error before saving',
  'userSettings.success.saved': 'Settings saved successfully',
  'userSettings.error.saveFailed': 'Failed to save settings: {error}',
  'userSettings.error.saveFailedNetwork': 'Failed to save settings: Network error',
  'userSettings.error.unknown': 'Unknown error',
  'userSettings.button.cancel': 'Cancel',
  'userSettings.button.save': 'Save Settings',
  'userSettings.button.saving': 'Saving...',
  'userSettings.theme.light': 'Light',
  'userSettings.theme.dark': 'Dark',
  // Trip Guide page
  'tripGuide.header.title': 'Guide Creator Dashboard',
  'tripGuide.header.subtitle': 'Create, manage, and analyze your guides in one place',
  'tripGuide.header.createGuide': 'Create New Guide',
  'tripGuide.tabs.draft': 'Draft',
  'tripGuide.tabs.published': 'Published',
  'tripGuide.tabs.analytics': 'Analytics',
  'tripGuide.draft.title': 'Draft Guides',
  'tripGuide.draft.empty': 'No draft guides',
  'tripGuide.draft.emptySubtitle': 'Create a new guide to get started',
  'tripGuide.published.title': 'Published Guides',
  'tripGuide.published.empty': 'No published guides',
  'tripGuide.published.emptySubtitle': 'Publish a draft guide to see it here',
  'tripGuide.card.public': 'Public',
  'tripGuide.card.sharedLink': 'Shared link',
  'tripGuide.card.draft': 'Draft',
  'tripGuide.card.untitled': 'Untitled Guide',
  'tripGuide.card.updated': 'Updated',
  'tripGuide.card.edit': 'Edit',
  'tripGuide.card.publish': 'Publish',
  'tripGuide.card.unpublish': 'Unpublish',
  'tripGuide.card.analytics': 'Analytics',
  'tripGuide.analytics.overview': 'Overview',
  'tripGuide.analytics.totalGuides': 'Total Guides',
  'tripGuide.analytics.publishedGuides': 'Published',
  'tripGuide.analytics.draftGuides': 'Draft',
  'tripGuide.analytics.totalViews': 'Total Views',
  'tripGuide.analytics.totalLikes': 'Total Likes',
  'tripGuide.analytics.totalReplicas': 'Total Replicas',
  'tripGuide.analytics.popularGuides': 'Popular Guides Ranking',
  'tripGuide.analytics.noPopularGuides': 'No published guides',
  'tripGuide.analytics.untitled': 'Untitled Guide',
  'tripGuide.analytics.views': 'Views',
  'tripGuide.analytics.likes': 'Likes',
  'tripGuide.analytics.replicas': 'Replicas',
  'tripGuide.modals.publish.title': 'Publish this guide?',
  'tripGuide.modals.publish.message': 'Publishing this guide will make it visible and replicable by other users.',
  'tripGuide.modals.publish.untitled': 'Untitled Guide',
  'tripGuide.modals.publish.publishing': 'Publishing...',
  'tripGuide.modals.publish.confirm': 'Publish',
  'tripGuide.modals.publish.cancel': 'Cancel',
  'tripGuide.modals.unpublish.title': 'Unpublish this guide?',
  'tripGuide.modals.unpublish.message': 'Unpublishing this guide will make it invisible to other users. Already replicated guides will not be affected.',
  'tripGuide.modals.unpublish.untitled': 'Untitled Guide',
  'tripGuide.modals.unpublish.unpublishing': 'Unpublishing...',
  'tripGuide.modals.unpublish.confirm': 'Unpublish',
  'tripGuide.modals.unpublish.cancel': 'Cancel',
  'tripGuide.modals.delete.title': 'Delete this guide?',
  'tripGuide.modals.delete.message': 'This action cannot be undone. The guide and all its data will be permanently deleted.',
  'tripGuide.modals.delete.untitled': 'Untitled Guide',
  'tripGuide.modals.delete.deleting': 'Deleting...',
  'tripGuide.modals.delete.confirm': 'Delete',
  'tripGuide.modals.delete.cancel': 'Cancel',
  // Country names (common countries)
  'country.JP': 'Japan',
  'country.US': 'United States',
  'country.CA': 'Canada',
  'country.AU': 'Australia',
  'country.NZ': 'New Zealand',
  'country.GB': 'United Kingdom',
  'country.DE': 'Germany',
  'country.FR': 'France',
  'country.IT': 'Italy',
  'country.ES': 'Spain',
  'country.KR': 'South Korea',
  'country.CN': 'China',
  'country.TW': 'Taiwan',
  'country.HK': 'Hong Kong',
  'country.SG': 'Singapore',
  'country.TH': 'Thailand',
  'country.MY': 'Malaysia',
  'country.ID': 'Indonesia',
  'country.PH': 'Philippines',
  'country.VN': 'Vietnam',
  'country.IN': 'India',
}

const ja: Dictionary = {
  features: '機能',
  pricing: 'プラン',
  contact: 'お問い合わせ',
  login: 'ログイン',
  tripGuide: 'トリップガイド',
  memories: '思い出',
  'memories.page.title': '思い出',
  'memories.page.description': '過去の旅行を振り返りましょう',
  'memories.page.empty': '思い出がまだありません',
  'memories.page.year': '年',
  'plan.page.title': '今後の旅行プラン',
  'plan.page.empty': '今後の旅行プランはありません',
  'header.profile': 'プロフィール',
  'header.changePlan': 'プランを変更',
  'header.logout': 'ログアウト',
  devTools: '開発ツール',
  'debug.badge': 'デバッグ',
  // Footer
  'footer.tagline': 'あなたの旅行を美しく管理する',
  'footer.products': '製品',
  'footer.products.summary': '概要',
  'footer.resources': 'リソース',
  'footer.company': '会社情報',
  'footer.about': 'このサイトについて',
  'footer.releaseNotes': 'リリースノート',
  'footer.backToTop': 'トップへ戻る',
  'footer.backToTopAria': 'ページ上部へ戻る',
  'footer.copyright': '© {year} Caglla. All rights reserved.',
  'footer.documentation': 'ドキュメント',
  'footer.blog': 'ブログ',
  'footer.faq': 'FAQ',
  'footer.support': 'サポート',
  'footer.privacyPolicy': 'プライバシーポリシー',
  'footer.termsOfService': '利用規約',
  'footer.cookieSettings': 'クッキー設定',
  // Privacy Policy page
  'privacy.title': 'プライバシーポリシー',
  'privacy.lastUpdated': '最終更新日: {date}',
  'privacy.preface.title': '前文',
  'privacy.preface.content': 'Caglla Travel Manager（以下「当サービス」）は、ユーザーの個人情報の保護を重要な責務と考え、以下のプライバシーポリシーを定めています。ユーザーは、本プライバシーポリシーに従って当サービスを利用することにより、個人情報の保護についての同意を与えることになります。',
  'privacy.collection.title': '情報の収集',
  'privacy.collection.intro': '当サービスでは、以下の情報を収集する場合があります：',
  'privacy.collection.googleAccount': 'Googleアカウント情報（名前、メールアドレス、プロフィール画像）',
  'privacy.collection.travelData': '旅行計画データ（旅程、宿泊先、観光地情報）',
  'privacy.collection.location': '位置情報（地図表示のため）',
  'privacy.collection.usage': 'サービス利用状況（機能の使用頻度、エラーログ）',
  'privacy.purpose.title': '情報収集の目的',
  'privacy.purpose.intro': '収集した情報は以下の目的で利用します：',
  'privacy.purpose.service': 'サービスの提供・運営',
  'privacy.purpose.authentication': 'ユーザー認証・アカウント管理',
  'privacy.purpose.management': '旅行計画の保存・管理',
  'privacy.purpose.improvement': 'サービス改善・新機能開発',
  'privacy.purpose.support': 'カスタマーサポート',
  'privacy.sharing.title': '情報の共有',
  'privacy.sharing.content': '当サービスは、ユーザーの同意がある場合、または法的義務がある場合を除き、個人情報を第三者と共有することはありません。',
  'privacy.protection.title': 'データの保護',
  'privacy.protection.content': '当サービスは、Firebase（Google Cloud Platform）のセキュリティ機能を活用し、ユーザーデータを適切に保護します。',
  'privacy.contact.title': 'お問い合わせ',
  'privacy.contact.content': 'プライバシーポリシーに関するご質問は、<a href="/contact">お問い合わせページ</a>からご連絡ください。',
  // Features page
  'features.intro': 'Cagllaの強みを、シンプルに。',
  'features.section1.title': '1. 個人・家族旅行者向けの機能',
  'features.section2.title': '2. 友達旅行向けの機能',
  'features.section3.title': '3. ツアーコンダクター向けの機能',
  'features.s1.map.title': '地図で旅程管理',
  'features.s1.map.li1': '日別・時間別のスケジュールを直感的に編集',
  'features.s1.map.li2': '地図上でルート確認、距離・所要時間の自動計算',
  'features.s1.map.li3': 'お気に入りスポットの保存とメモ',
  'features.s1.checklist.title': 'チェックリスト',
  'features.s1.checklist.li1': '季節・滞在日数に応じた持ち物の自動提案',
  'features.s1.checklist.li2': 'カテゴリ別に進捗管理（必需品/衣類/ガジェット など）',
  'features.s2.share.title': 'スケジュール共有',
  'features.s2.share.li1': 'iCal（.ics）購読でGoogle/Apple/Outlookに同期',
  'features.s2.share.li2': '公開/非公開やリンク共有の権限コントロール',
  'features.s2.pdf.title': 'PDFエクスポート',
  'features.s2.pdf.li1': '旅程・地図リンク・予約情報を見やすいレイアウトで出力',
  'features.s2.pdf.li2': 'オフライン参照向け（A4/US Letter対応）',
  'features.s3.cost.title': '費用合計の算出',
  'features.s3.cost.li1': 'カテゴリ/日別の費用を自動集計、通貨換算にも対応',
  'features.s3.cost.li2': '旅程の変更に連動してリアルタイム更新',
  'features.s3.optimize.title': 'ルート最適化',
  'features.s3.optimize.li1': '複数地点の最適訪問順序を自動計算',
  'features.s3.optimize.li2': '移動手段/回避設定（高速/有料/フェリー）を選択可能',
  // Pricing page
  'pricing.intro': 'シンプルな3プラン。必要な機能だけを、わかりやすく。',
  'pricing.choosePlan': 'プランを選ぶ',
  'pricing.cta.title': '今すぐはじめましょう',
  'pricing.cta.subtitle': '無料プランからお試し可能。必要に応じていつでもアップグレード。',
  'pricing.cta.support': 'サポートへ',
  'pricing.cta.docs': 'ドキュメントを見る',
  'pricing.season.subtitle': '基本機能',
  'pricing.season.li1': 'Trip/Day/Itinerary の管理',
  'pricing.season.li2': 'Google Maps 表示',
  'pricing.season.li3': '共有リンク',
  'pricing.backpacker.subtitle': 'ルート最適化など',
  'pricing.backpacker.li1': 'season_traveler のすべて',
  'pricing.backpacker.li2': 'ルート最適化（基本）',
  'pricing.backpacker.li3': 'カスタム機能',
  'pricing.globetrotter.subtitle': '全機能・無制限',
  'pricing.globetrotter.li1': 'backpacker のすべて',
  'pricing.globetrotter.li2': 'ルート最適化（拡張）',
  'pricing.globetrotter.li3': '上限緩和・優先サポート',
  'pricing.price.season': '¥0',
  'pricing.price.backpacker': '¥480/月',
  'pricing.price.globetrotter': '¥980/月',
  // Contact page
  'contact.title': 'お問い合わせ',
  'contact.sectionTitle': 'お問い合わせ',
  'contact.success': 'お問い合わせありがとうございます。内容を確認の上、回答いたします。',
  'contact.name': 'お名前',
  'contact.email': 'メールアドレス',
  'contact.subject': '件名',
  'contact.subject.placeholder': '選択してください',
  'contact.subject.bug': 'バグ報告',
  'contact.subject.feature': '機能要望',
  'contact.subject.account': 'アカウント関連',
  'contact.subject.billing': '課金・プラン関連',
  'contact.subject.other': 'その他',
  'contact.message': 'メッセージ',
  'contact.message.placeholder': 'お問い合わせ内容を詳しくお書きください',
  'contact.submit': '送信する',
  'contact.submitting': '送信中... ',
  'contact.info.title': '連絡先情報',
  'contact.info.general': 'サービスに関するご質問、バグ報告、機能要望などは、上記フォームからお送りください。',
  'contact.info.urgent': 'セキュリティに関する重要な問題については、できるだけ早急に対応いたします。',
  'contact.info.responseTime': '通常のお問い合わせには2-3営業日以内に回答いたします。複雑な問題については、回答までにお時間をいただく場合があります。',
  'contact.info.faq': 'よくある質問については、FAQページをご確認ください。',
  // About page
  'about.hero.line1': 'Travel',
  'about.hero.line2': 'Planning',
  'about.hero.line3': 'Simplified',
  'about.intro': 'Caglla は、旅行計画を美しく、簡単に管理できるプラットフォームです。複雑な旅程管理を直感的なツールに変えます。',
  'about.story.title': 'Our Story',
  'about.story.p1': '2024年、私たちは旅行計画の煩雑さに直面していました。複数のアプリ、散らばったメモ、紙の地図…。',
  'about.story.p2': '「もっと簡単に、もっと美しく、旅行を管理できるツールがあればいいのに」',
  'about.story.p3': 'そこからCagllaは生まれました。Google Mapsと連携し、旅程・宿泊・飲食・観光を一箇所で管理し、リアルタイムで共有します。',
  'about.mission.title': 'Our Mission & Values',
  'about.mission.simplicity.title': 'Simplicity First',
  'about.mission.simplicity.text': '誰でも使える直感的なデザインを優先します。旅行計画は楽しく。',
  'about.mission.collab.title': 'Collaboration',
  'about.mission.collab.text': '旅行は一人で行くものではありません。共同計画を簡単に。',
  'about.mission.security.title': 'Privacy & Security',
  'about.mission.security.text': '旅行データは大切です。最高レベルのセキュリティで保護します。',
  'about.building.title': 'What We\'re Building',
  'about.building.item1.title': '詳細な旅程管理',
  'about.building.item1.text': '日別・時間別の予定、宿泊、飲食、観光を一箇所で管理。',
  'about.building.item2.title': 'Google Maps連携',
  'about.building.item2.text': '地図上で視覚的に最適ルートを計画。距離や所要時間も自動計算。',
  'about.building.item3.title': 'リアルタイム共有',
  'about.building.item3.text': '家族や友人と共有・共同編集で、最高の旅を作り上げる。',
  'about.stats.year': '設立年',
  'about.stats.possibility': '旅行の可能性',
  'about.stats.passion': '情熱を注いで開発中',
  'about.cta.title': 'Join Us on This Journey',
  'about.cta.subtitle': '一緒に、旅行計画の未来を作りましょう',
  'about.cta.contact': 'お問い合わせ',
  'about.cta.getStarted': '始めてみる',
  // Terms page
  'terms.title': '利用規約',
  'terms.updated': '最終更新',
  'terms.s1.title': '1. はじめに',
  'terms.s1.p1': '本規約は Caglla Travel Manager の利用条件を定めるものです。ご利用前にご確認ください。',
  'terms.s2.title': '2. サービスの内容',
  'terms.s2.intro': '当サービスは以下の機能を提供します：',
  'terms.s2.li1': '旅行計画の作成・管理',
  'terms.s2.li2': '旅程のスケジュール管理',
  'terms.s2.li3': '観光地・宿泊先の検索・登録',
  'terms.s2.li4': '地図表示・ルート最適化',
  'terms.s2.li5': '予約情報の管理',
  'terms.s3.title': '3. 利用条件',
  'terms.s3.intro': 'ユーザーは以下の条件を満たす必要があります：',
  'terms.s3.li1': 'Googleアカウントによる認証',
  'terms.s3.li2': '本規約への同意',
  'terms.s3.li3': '適切な利用目的での使用',
  'terms.s3.li4': '法令・公序良俗に反しない利用',
  'terms.s4.title': '4. 禁止事項',
  'terms.s4.intro': '以下の行為を禁止します：',
  'terms.s4.li1': '違法・有害なコンテンツの投稿',
  'terms.s4.li2': '他ユーザーの権利を侵害する行為',
  'terms.s4.li3': 'サービスの正常な運営を妨げる行為',
  'terms.s4.li4': '不正アクセス・ハッキング行為',
  'terms.s4.li5': 'その他、当サービスが不適切と判断する行為',
  'terms.s5.title': '5. 免責事項',
  'terms.s5.p1': '故意または重過失を除き、当サービスの利用により生じた損害について一切の責任を負いません。中断・停止・終了による損害も同様です。',
  'terms.s6.title': '6. 規約の変更',
  'terms.s6.p1': '必要に応じて本規約を変更することがあります。変更後の規約は掲示時点で効力を生じます。',
  'terms.s7.title': '7. お問い合わせ',
  'terms.s7.p1': '本規約に関するご質問はお問い合わせページからご連絡ください。',
  'terms.s7.contact': 'お問い合わせページ',
  // Docs page
  'docs.title1': 'ドキュメント',
  'docs.title2': 'ガイド & 仕様',
  'docs.intro': 'Caglla の使い方・仕様・ベストプラクティスをここから辿れます。',
  'docs.search.title': '検索',
  'docs.search.placeholder': 'ガイドを検索（例：Itinerary、Maps、環境変数）',
  'docs.guides.title': 'ガイド',
  'docs.shortcuts.title': 'ショートカット',
  'docs.shortcuts.support': 'サポート',
  'docs.shortcuts.support.sub': 'ヘルプセンターへ',
  'docs.shortcuts.faq': 'FAQ',
  'docs.shortcuts.faq.sub': 'よくある質問',
  'docs.shortcuts.releases': 'リリースノート',
  'docs.shortcuts.releases.sub': 'バージョン履歴',
  'docs.cta.title': 'ガイドで見つからない場合',
  'docs.cta.subtitle': 'サポートまたはFAQをご確認ください。必要ならお問い合わせください。',
  'docs.cta.support': 'サポートへ',
  'docs.cta.faq': 'FAQを見る',
  'docs.empty': '該当するガイドが見つかりませんでした。',
  // Blog list page
  'blog.title1': 'ブログ',
  'blog.title2': 'ニュース & アップデート',
  'blog.intro': '最新情報、開発の裏側、使い方のヒントをお届けします。',
  'blog.search.title': '検索',
  'blog.search.placeholder': '記事を検索（例：Support、Roadmap、Updates）',
  'blog.latest': '最新記事',
  'blog.empty': '該当する記事が見つかりませんでした。',
  'blog.cta.title': '最新情報を見逃さないで',
  'blog.cta.subtitle': 'Support/Docs/FAQもあわせてご活用ください。',
  'blog.cta.support': 'サポートへ',
  'blog.cta.docs': 'ドキュメントを見る',
  // Blog post page
  'blog.post.notfound.title': '記事が見つかりませんでした',
  'blog.post.notfound.desc': 'URLをご確認いただくか、ブログ一覧に戻ってください。',
  'blog.post.back': '← ブログ一覧に戻る',
  // Home (Top) page
  'home.hero.line1': 'Travel',
  'home.hero.line2': 'Planning',
  'home.hero.line3': 'Simplified',
  'home.intro': '詳細な旅程、宿泊先、観光スポットまで一括管理。Google Maps連携で美しくシンプルに。',
  'home.cta.primary.title': 'はじめる',
  'home.cta.primary.button': 'Googleで始める',
  'home.cta.primary.seeFeatures': '機能を見る',
  'home.features.title': 'Features',
  'home.features.card1.title': '詳細な旅行計画',
  'home.features.card1.text': '日別の旅程、宿泊、スポットを一括管理。',
  'home.features.card2.title': 'チーム共有',
  'home.features.card2.text': '家族や友人と共同編集、リアルタイム共有。',
  'home.features.card3.title': 'どこでもアクセス',
  'home.features.card3.text': '全デバイスで美しく表示。',
  'home.cta.bottom.title': '今すぐ始めましょう',
  'home.cta.bottom.subtitle': '無料でお試し。必要に応じていつでもアップグレード。',
  'home.cookie.title': 'クッキーについて',
  'home.cookie.text': 'このサイトでは、サービスの提供と分析のためにクッキーを使用しています。サイトを利用することで、クッキーの使用に同意したものとみなされます。',
  'home.cookie.more': '詳細を見る',
  'home.cookie.reject': '拒否',
  'home.cookie.accept': '同意する',
  // Home Dashboard page (/home)
  'home.dashboard.recentlyChecked.title': '最近チェックした旅行',
  'home.dashboard.recentlyChecked.empty': '最近チェックした旅行はありません',
  'home.dashboard.recentlyChecked.planned': '（実装予定）',
  'home.dashboard.memories.title': '思い出',
  'home.dashboard.memories.count': '{count}件',
  'home.dashboard.memories.viewAll': 'すべての思い出',
  'home.dashboard.upcomingTrips.title': '近日',
  'home.dashboard.upcomingTrips.count': '{count}件',
  'home.dashboard.upcomingTrips.viewAll': 'すべての旅行プラン',
  'home.dashboard.upcomingTrips.empty': '近日の予定はありません',
  'home.dashboard.upcomingTrips.today': '今日',
  'home.dashboard.ongoingTrips.title': '進行中',
  'home.dashboard.ongoingTrips.subtitle': '最大3件まで表示します',
  'home.dashboard.ongoingTrips.more': 'More',
  'home.dashboard.ongoingTrips.empty': '進行中のTripはありません',
  'home.dashboard.ongoingTrips.createNew': '新規作成',
  'home.dashboard.ongoingTrips.period': '期間',
  'home.dashboard.ongoingTrips.remainingDays': '残り日数',
  'home.dashboard.ongoingTrips.untilToday': '今日まで',
  'home.dashboard.countryStats.title': '国別統計',
  'home.dashboard.countryStats.summary': '{totalTrips}回の旅行 • {totalCountries}カ国',
  'home.dashboard.countryStats.times': '回',
  'home.dashboard.countryStats.empty': 'まだ旅行がありません',
  'home.dashboard.countryStats.error': 'エラーが発生しました',
  'home.dashboard.countryStats.retry': '再試行',
  'home.dashboard.countryStats.viewDetails': '詳細を見る →',
  'home.dashboard.planInfo.error': 'プラン情報が取得できませんでした',
  'home.dashboard.planInfo.tripLimit': '旅行設定数',
  'home.dashboard.planInfo.tripLimitCount': '{count} / {max}件',
  'home.dashboard.planInfo.changePlan': 'プラン変更',
  'home.dashboard.nextTrip.title': '次の旅行プラン',
  'home.dashboard.nextTrip.createNew': '新しい旅行を作成',
  'home.dashboard.nextTrip.create': '旅行を作成',
  'home.dashboard.nextTrip.description': 'あなたの次の冒険を確認しましょう',
  'home.dashboard.nextTrip.createDescription': '素晴らしい冒険の計画を始めましょう',
  'home.dashboard.nextTrip.empty.title': 'まだ旅行がありません',
  'home.dashboard.nextTrip.empty.description': '最初の旅行を作成して、素晴らしい冒険を始めましょう！',
  'home.dashboard.nextTrip.empty.mapPlaceholder': '旅行マップ',
  'home.dashboard.nextTrip.empty.mapDescription': '旅行を作成すると地図が表示されます',
  'home.dashboard.storage.title': 'ストレージ使用量',
  'home.dashboard.storage.inUse': '{percentage}% 使用中',
  'home.dashboard.storage.files': 'ファイル',
  'home.dashboard.storage.fetchError': 'ストレージ使用量の取得に失敗しました',
  'home.dashboard.storage.deleteError': 'ファイルの削除に失敗しました',
  'home.dashboard.storage.retry': '再試行',
  'home.dashboard.storage.details.title': 'プラン詳細',
  'home.dashboard.storage.details.warning': 'ストレージ使用量が{percentage}%を超えています。',
  'home.dashboard.storage.details.upgradeSuggestion': ' プランのアップグレードを検討してください。',
  'home.dashboard.storage.details.limitReached': 'ストレージ制限に達しています。ファイルを削除するか、プランをアップグレードしてください。',
  'home.dashboard.storage.details.history': 'アップロード履歴',
  'home.dashboard.storage.details.fileName': 'ファイル名',
  'home.dashboard.storage.details.size': 'サイズ',
  'home.dashboard.storage.details.type': '種類',
  'home.dashboard.storage.details.dateTime': '日時',
  'home.dashboard.storage.details.action': '操作',
  'home.dashboard.storage.details.avatar': 'アバター',
  'home.dashboard.storage.details.tripImage': '旅行画像',
  'home.dashboard.storage.details.deleting': '削除中...',
  'home.dashboard.storage.details.delete': '削除',
  'home.dashboard.storage.details.refresh': 'データを更新',
  // Home Dashboard header row (/home welcome section)
  'home.welcome.title': 'おかえりなさい',
  'home.welcome.subtitle': 'あなたの旅を整理して、次の計画につなげましょう',
  'home.welcome.createTrip': '旅行を作成',
  'home.welcome.quickPlan': 'クイックプラン',
  'home.welcome.createGuide': 'ガイドを作成',
  // Home Dashboard main tabs (/home left column)
  'home.mainTabs.shares': '自分のシェア',
  // Profile page
  'profile.back': '← 戻る',
  'profile.title': 'プロフィール',
  'profile.setup': 'プロフィール設定',
  'profile.edit': '編集',
  'profile.cancel': 'キャンセル',
  'profile.loading': '読み込み中...',
  'profile.setupBanner.title': 'プロフィールを完成させましょう！',
  'profile.setupBanner.description': 'あなたについて教えてください。他のユーザーとつながりやすくなります。',
  'profile.name': '名前',
  'profile.bio': '自己紹介',
  'profile.bio.placeholder': 'あなたについて教えてください...',
  'profile.bio.empty': '自己紹介を追加してください',
  'profile.residenceArea': '居住地域',
  'profile.residenceArea.placeholder': '居住地域を検索（例: 東京都渋谷区、San Jose, CA）',
  'profile.residenceArea.warning': '⚠️ 正確な国情報のため、Google Placesから居住地域を選択してください',
  'profile.estimatedCountry': '推定居住国:',
  'profile.gender': '性別',
  'profile.gender.preferNotToSay': '回答しない',
  'profile.gender.male': '男性',
  'profile.gender.female': '女性',
  'profile.gender.other': 'その他',
  'profile.language': '言語設定',
  'profile.language.auto': '自動（ブラウザ設定）',
  'profile.language.description': '場所検索の結果言語に影響します。未選択時はブラウザの言語設定を使用します。',
  'profile.save': '保存',
  'profile.saving': '保存中...',
  'profile.complete': 'プロフィールを完成',
  'profile.skip': 'スキップ',
  'profile.image.title': 'プロフィール画像',
  'profile.image.change': '画像を変更',
  'profile.image.upload': '画像をアップロード',
  'profile.image.uploading': 'アップロード中...',
  'profile.image.formats': 'JPEG、PNG、WebP形式（5MB以下）',
  'profile.image.alt': 'プロフィール画像',
  'profile.image.invalid': '無効なファイルです',
  'profile.image.uploadFailed': '画像のアップロードに失敗しました',
  'profile.image.unknownError': '不明なエラー',
  'profile.image.deleteFailed': '画像の削除に失敗しました',
  'profile.publicTrips.title': '公開された旅行',
  'profile.publicTrips.empty': 'まだ公開された旅行がありません',
  'profile.publicTrips.empty.description': '旅行を作成して、他のユーザーと共有しましょう！',
  'profile.privateTrips.title': '非公開の旅行',
  'profile.privateTrips.empty': 'まだ非公開の旅行がありません',
  'profile.privateTrips.empty.description': '非公開の旅行はあなたのみが閲覧できます。',
  'profile.stats.title': '旅行統計',
  'profile.stats.totalTrips': '総旅行回数',
  'profile.stats.totalCountries': '訪問国数',
  'profile.stats.countries.title': '訪問国トップ5',
  'profile.stats.times': '回',
  'profile.stats.countries.more': 'あと{count}カ国',
  // iCal Publish Modal
  'ical.title': 'iCal公開設定',
  'ical.close': '閉じる',
  'ical.closeButton': '閉じる',
  'ical.premiumFeature': 'プレミアム機能',
  'ical.premiumFeatureDescription': 'iCal公開機能はBackpacker以上のプランで利用できます。',
  'ical.about.title': 'iCal公開機能について',
  'ical.about.li1': 'Google Calendar、Apple Calendar等のカレンダーアプリに取り込めます',
  'ical.about.li2': 'カレンダーアプリが定期的に自動更新します',
  'ical.about.li3': 'URLを知っている人なら誰でもアクセスできます',
  'ical.about.li4': 'いつでも無効化できます',
  'ical.enabled': 'iCal公開中',
  'ical.disable': '無効化',
  'ical.tripUrl': '旅程全体のiCal URL',
  'ical.reservationsUrl': '予約情報のみのiCal URL',
  'ical.copy': 'コピー',
  'ical.copied': 'コピー済み',
  'ical.addToCalendar.title': 'カレンダーアプリへの追加方法',
  'ical.addToCalendar.google': 'Google Calendar: 「他のカレンダー」→「URLで追加」→ URLを貼り付け',
  'ical.addToCalendar.apple': 'Apple Calendar: 「ファイル」→「新規カレンダー照会」→ URLを貼り付け',
  'ical.addToCalendar.outlook': 'Outlook: 「カレンダー追加」→「インターネットから」→ URLを貼り付け',
  'ical.disabled': 'iCal公開が無効です',
  'ical.enabling': '有効化中...',
  'ical.enable': 'iCal公開を有効化',
  'ical.enableError': 'iCal公開の有効化に失敗しました',
  'ical.disableConfirm': 'iCal公開を無効にしますか？外部カレンダーアプリからアクセスできなくなります。',
  'ical.disableError': 'iCal公開の無効化に失敗しました',
  'ical.planRequired': 'iCal公開機能はBackpacker以上のプランで利用できます',
  // Trip Itinerary Page
  'trip.calendarPublish': 'Calendar 配信',
  'trip.itinerary': '日程',
  'trip.schedule.time': '時間',
  'trip.schedule.cost': '費用',
  'trip.schedule.reservation': '予約',
  'trip.schedule.activity': 'アクティビティ',
  'trip.schedule.categorySelect': 'アクティビティを選択',
  'trip.schedule.categoryDetail': '詳細選択',
  'trip.schedule.clear': 'クリア',
  'trip.schedule.selected': '選択中',
  'trip.schedule.saveFailed': 'スケジュールの保存に失敗しました',
  'subscription.error': 'サブスクリプションの処理中にエラーが発生しました',
  'trip.routeOptimization.title': 'ルート最適化',
  'trip.routeOptimization.button': 'ルート最適化',
  'trip.routeOptimization.optimizing': '最適化中...',
  'trip.routeOptimization.needTwoOrMore': 'ルート最適化には2つ以上の場所が必要です',
  'trip.routeOptimization.failed': 'ルート最適化に失敗しました',
  'trip.routeOptimization.error': 'ルート最適化中にエラーが発生しました',
  'trip.routeOptimization.calculatePlaces': '{count}箇所の最適ルートを計算',
  'trip.routeOptimization.optimizedOrder': '最適化された訪問順序',
  'trip.routeOptimization.apply': 'この順序を適用',
  'trip.routeOptimization.cancel': 'キャンセル',
  'trip.routeOptimization.applyFailed': '最適化の適用に失敗しました',
  'trip.itineraryView.title': '日程',
  'trip.itineraryView.addDay': '日程を追加',
  'trip.itineraryView.expandAll': '全て展開',
  'trip.itineraryView.collapseAll': '全て折りたたみ',
  'trip.itineraryView.empty.title': 'まだ日程が追加されていません',
  'trip.itineraryView.empty.description': '日程を追加して旅行を計画しましょう',
  // Day Editor
  'dayEditor.placeholder': 'この日は何をする日？',
  'dayEditor.saving': '保存中...',
  'dayEditor.editHint': 'Enterで改行、Escapeでキャンセル、他の場所をクリックで保存',
  'dayEditor.clickToEdit': 'クリックして編集',
  'dayEditor.updateError': '日程の更新に失敗しました',
  'dayEditor.noDescription': '説明がありません',
  'dayEditor.deleteDay': 'この日を削除',
  'dayEditor.deleteConfirm': 'この日を削除してもよろしいですか？',
  'dayEditor.deleteConfirmWithItineraries': 'この日には予定が含まれています。削除するとすべての予定も削除されます。よろしいですか？',
  'dayEditor.deleteError': '日程の削除に失敗しました',
  // Navigation Menu
  'nav.weatherForecast': '天気予報',
  'nav.reservation': '予約情報',
  'nav.reservationTitle': 'Reservation',
  'nav.travelCost': '旅行費用',
  'nav.budgetTitle': 'Budget',
  'nav.activityStats': 'アクティビティ統計',
  'nav.activityStatisticsTitle': 'Activity Statistics',
  'nav.totalDistance': '総移動距離',
  'nav.distancesTitle': 'Distances',
  'nav.schedule': '日程',
  // POI Dialog
  'poi.website': 'ウェブサイト',
  'poi.cached': 'キャッシュ',
  'poi.loading': '読み込み中...',
  'poi.loadingInfo': 'POI情報を読み込み中...',
  'poi.photoOf': '{name}の写真',
  'poi.fetchDetailsError': 'POI詳細情報の取得に失敗しました',
  'poi.fetchError': 'POI情報の取得に失敗しました',
  'poi.imageCacheError': 'POIDialog: 画像キャッシュに失敗しました',
  'poi.errorMessage': 'POI情報を取得中にエラーが発生しました',
  'poi.addToItinerary': '旅程に追加',
  'poi.showPartial': '一部を表示',
  'poi.showAll': 'すべて表示 ({count})',
  'poi.reviewsAndTips': 'レビュー・Tips',
  'poi.helpfulVotes': '{count} 人が参考になったと評価',
  'poi.reviewCount': '{count}件',
  'poi.daySelector.title': '追加する日を選択',
  'poi.openingHours.open': '営業中',
  'poi.openingHours.closed': '営業時間外',
  'poi.openingHours.openingSoon': 'もうすぐ開店',
  'poi.openingHours.open24h': '24時間営業',
  'poi.openingHours.closedDay': '定休日',
  'poi.businessStatus.temporarilyClosed': '一時休業中',
  'poi.businessStatus.permanentlyClosed': '閉業',
  'poi.weekday.sunday': '日',
  'poi.weekday.monday': '月',
  'poi.weekday.tuesday': '火',
  'poi.weekday.wednesday': '水',
  'poi.weekday.thursday': '木',
  'poi.weekday.friday': '金',
  'poi.weekday.saturday': '土',
  'poi.weekday.sundayShort': '日',
  'poi.weekday.mondayShort': '月',
  'poi.weekday.tuesdayShort': '火',
  'poi.weekday.wednesdayShort': '水',
  'poi.weekday.thursdayShort': '木',
  'poi.weekday.fridayShort': '金',
  'poi.weekday.saturdayShort': '土',
  // Reservation Display
  'reservation.title': '予約情報',
  'reservation.empty': '予約情報がありません',
  'reservation.empty.description': 'Itineraryに予約情報を追加してください',
  'reservation.count': '件',
  'reservation.timeRange': '〜',
  // Activity Analysis Display
  'activity.analysis.empty': 'アクティビティタグが設定されていません。',
  'activity.analysis.empty.description': '旅程にアクティビティタグを追加すると、ここに統計が表示されます。',
  'activity.analysis.total': 'アクティビティ総数',
  'activity.analysis.categoryDistribution': 'カテゴリー別分布',
  'activity.analysis.detailsTop5': '詳細アクティビティ Top 5',
  'activity.analysis.times': '回',
  // Distance Display
  'distance.title': '総移動距離',
  'distance.loading': '総移動距離を計算中...',
  'distance.error.calculationFailed': '距離計算に失敗しました',
  'distance.error.totalCalculationFailed': '総移動距離の計算に失敗しました',
  'distance.empty.noPlaces': '場所情報が設定されたスケジュールがありません',
  'distance.empty.needTwoOrMore': '移動距離を計算するには、場所情報が設定されたスケジュールが2つ以上必要です',
  'distance.empty.description': '各スケジュールに場所を設定すると、総移動距離が表示されます',
  'distance.visitedPlaces': '訪問地',
  'distance.total': '総距離',
  'distance.totalTime': '総時間',
  'distance.average': '平均距離',
  'distance.averageTime': '平均時間',
  'distance.perSegment': '/区間',
  'distance.perTimeSegment': '分/区間',
  'distance.hint.details': '各Venue間の詳細な距離・時間はスケジュール内で確認できます',
  'distance.openTransit': 'Google Transitで開く',
  'distance.openTransitUnavailable': '場所情報が不足しているためTransitリンクは利用できません',
  // Navigation
  'nav.summary': '概要',
  'nav.itinerary': '日程',
  'nav.checklist': 'チェックリスト',
  'nav.plan': 'プラン',
  'nav.profile': 'プロフィール',
  'nav.logout': 'ログアウト',
  'nav.dayPrefix': 'Day',
  'nav.dayAbbr': 'DAY',
  // Common
  'common.close': '閉じる',
  'common.deleteFailed': '削除に失敗しました',
  'common.deleteError': '削除中にエラーが発生しました',
  'common.cancel': 'キャンセル',
  'common.save': '保存',
  'common.saving': '保存中...',
  'common.delete': '削除',
  'common.retry': '再試行',
  'common.goHome': 'ホームに戻る',
  // Admin / Dev Tools
  'admin.logs.timezone.deleteConfirm': 'タイムゾーン失敗ログをすべて削除しますか？',
  'admin.logs.currency.deleteConfirm': '通貨失敗ログをすべて削除しますか？',
  'admin.logs.deleteAllConfirm': 'すべてのログを削除しますか？',
  'admin.logs.timezone.processed': '{count}件のタイムゾーンログを処理しました。',
  'admin.logs.currency.processed': '{count}件の通貨ログを処理しました。',
  'admin.logs.mapping.updated': '{processedCount}件のログを処理し、{updateCount}件のマッピングを更新しました。',
  'admin.logs.insufficientLogs': '処理対象のログが不足しています（50件未満）。',
  'admin.logs.batchFailed': 'バッチ処理に失敗しました。',
  // Schedule
  'schedule.time.updateFailed': '時間の更新に失敗しました',
  'schedule.cost.updateFailed': '費用の更新に失敗しました',
  // Export Data Modal
  'export.error': 'エクスポート中にエラーが発生しました',
  'export.description.trip.json': '旅程全体のデータ（旅行情報、日程、Itinerary、予約情報）をJSON形式でエクスポートします。',
  'export.description.trip.csv': '旅程全体のItinerary一覧をCSV形式でエクスポートします。Excel等で編集可能です。',
  'export.description.trip.ical': '旅程全体のItineraryをiCalendar形式でエクスポートします。Google Calendar、Apple Calendar等に取り込めます。',
  'export.description.reservation.json': '予約情報のみをJSON形式でエクスポートします。',
  'export.description.reservation.csv': '予約情報のみをCSV形式でエクスポートします。Excel等で編集可能です。',
  'export.description.reservation.ical': '予約情報のみをiCalendar形式でエクスポートします。カレンダーアプリに取り込んで予定管理・通知設定ができます。',
  // Subscription Modal
  'subscription.processing': '処理中...',
  'subscription.startNow': '今すぐ始める',
  // Place Search Input
  'placeSearch.placeholder': '場所を検索...',
  'placeSearch.searchFailed': '場所の検索に失敗しました',
  'placeSearch.detailsFailed': '場所の詳細情報の取得に失敗しました',
  'placeSearch.selectFailed': '場所の選択に失敗しました',
  'placeSearch.noResults': '該当する場所が見つかりませんでした',
  // Common UI
  'common.dragHandle': 'ドラッグして順序を変更',
  'common.openMenu': 'メニューを開く',
  'schedule.addVenueBetween': '間にVenueを追加',
  // Checklist
  'checklist.addItem': '項目を追加',
  // Route Optimization
  'routeOptimization.failed': 'ルート最適化に失敗しました',
  'routeOptimization.optimizedRoute': '最適化されたルート',
  'routeOptimization.loading': 'ルート最適化を実行中...',
  'routeOptimization.noResult': 'ルート最適化の結果がありません',
  'routeOptimization.totalDistance': '総距離',
  'routeOptimization.totalDuration': '総時間',
  'routeOptimization.optimizedOrder': '最適化された順序',
  'routeOptimization.apiCost': 'APIコスト',
  'routeOptimization.insufficientWaypoints': 'ルート最適化には2つ以上の地点が必要です',
  'routeCost.failed': 'コスト見積もりの取得に失敗しました',
  'routeCost.suggestion': 'コスト削減の提案:',
  'routeCost.label': 'ルート最適化コスト:',
  'routeCost.waypoints': '{waypointCount}地点 → {requestsNeeded}回のAPI呼び出し',
  // Trip Itinerary View
  'tripItinerary.invalidDate': '日付が無効です',
  'tripItinerary.dateNotSet': '日付が設定されていません',
  'tripItinerary.expand': '展開',
  'tripItinerary.collapse': '折りたたみ',
  'tripItinerary.addVenue': 'Venueを追加',
  'tripItinerary.addVenueAtEnd': '最後にVenueを追加',
  // Schedule Card
  'scheduleCard.reservationSaveFailed': '予約情報の保存に失敗しました',
  'scheduleCard.collapse': '折りたたむ',
  'scheduleCard.readMore': '続きを読む',
  'scheduleCard.memo.hasDescription': 'Memo: 場所の説明が表示されています。クリックして編集できます。',
  'scheduleCard.memo.addMemo': 'Memo: メモを追加してください',
  // Trip Editor
  'tripEditor.dateValidation': '出発日は帰宅日より前の日付を選択してください',
  'tripEditor.destinationPlaceholder': '目的地を検索（例: 東京、パリ、ニューヨーク）',
  'tripEditor.title': '旅行情報を編集',
  'tripEditor.destinationReSelectHint': '正確な国情報のため、Google Placesから目的地を再選択してください',
  'tripEditor.accessLevel.private': 'プライベート — 自分と招待した友人だけに共有',
  'tripEditor.accessLevel.public': 'パブリック — 誰でも閲覧できる紹介用',
  'tripEditor.field.publishStatus': '公開ステータス',
  'tripEditor.publishStatus.draft': '下書き — 作業中',
  'tripEditor.publishStatus.published': '公開済み — 誰でも閲覧可能',
  'tripEditor.field.title': '旅行のタイトル *',
  'tripEditor.field.description': '説明',
  'tripEditor.field.startDate': '出発日',
  'tripEditor.field.endDate': '帰宅日',
  'tripEditor.field.accessLevel': '公開設定',
  'tripEditor.field.image': '旅行の画像',
  'tripEditor.field.destination': '目的地',
  'tripEditor.field.defaultCurrency': 'デフォルト通貨',
  'tripEditor.field.defaultCurrency.hint': '新しいスケジュール項目のデフォルト通貨として使用されます',
  'tripEditor.currency.major': '主要通貨',
  'tripEditor.currency.others': 'その他の通貨',
  'tripEditor.deleteConfirm.title': '旅行を削除しますか？',
  'tripEditor.deleteConfirm.message': '「{title}」を削除します。この操作は取り消せません。',
  'tripEditor.deleteConfirm.deleting': '削除中...',
  // Image Upload
  'imageUpload.invalidFile': '無効なファイルです',
  'imageUpload.loginRequired': 'ログインが必要です',
  'imageUpload.userIdNotFound': 'ユーザーIDが取得できません。ログインし直してください。',
  'imageUpload.userInfoNotFound': 'ユーザー情報が取得できません。ログインし直してください。',
  'imageUpload.avatar': 'プロフィール画像',
  'imageUpload.uploadFailed': '画像のアップロードに失敗しました: {error}',
  'imageUpload.unknownError': '不明なエラーが発生しました',
  'imageUpload.uploading': 'アップロード中...',
  'imageUpload.selectAnother': '別の画像を選択',
  'imageUpload.dropHere': 'ここに画像をドロップ',
  'imageUpload.clickOrDrag': '画像をクリックまたはドラッグ&ドロップしてアップロード',
  'imageUpload.error.auth': '認証エラー',
  'imageUpload.error.auth.description': 'Firebase Storageへのアクセス権限がありません',
  'imageUpload.error.canceled': 'アップロードがキャンセルされました',
  'imageUpload.error.unknown': '不明なエラーが発生しました',
  'imageUpload.error.invalidArgument': '無効な引数です',
  'imageUpload.error.invalidChecksum': 'ファイルのチェックサムが無効です',
  'imageUpload.error.invalidFormat': 'ファイル形式が無効です',
  'imageUpload.error.invalidName': 'ファイル名が無効です',
  'imageUpload.error.objectNotFound': 'ファイルが見つかりません',
  'imageUpload.error.projectNotFound': 'Firebase プロジェクトが見つかりません',
  'imageUpload.error.quotaExceeded': 'ストレージの容量制限を超えました',
  'imageUpload.error.unauthenticated': '認証されていません',
  'imageUpload.error.uploadFailed': '画像のアップロードに失敗しました',
  'imageUpload.error.storageQuotaExceeded': 'ストレージ制限を超えています: {error}',
  'imageUpload.error.quotaCheckFailed': 'ストレージ制限の確認に失敗しました',
  'imageUpload.error.storageUsageUpdateFailed': 'ストレージ使用量の更新に失敗しました',
  // Timezone Log Manager
  'timezoneLog.showDetails': '詳細を表示',
  'timezoneLog.hideDetails': '詳細を隠す',
  // Schedule Card Menu
  'scheduleCardMenu.moveFailed': '日程の移動に失敗しました',
  'scheduleCardMenu.duplicateFailed': '日程の複製に失敗しました',
  // Venue Distance
  'venueDistance.calculationFailed': '距離の計算に失敗しました',
  // Country Map
  'countryMap.loadFailed': '地図の読み込みに失敗しました',
  // Daily Route Optimizer
  'routeOptimizer.unknownPlace': '不明な場所',
  // Trip Map
  'tripMap.loadFailed': 'Google Maps APIの読み込みに失敗しました',
  'tripMap.loadFailedWarning': '⚠️ 地図の読み込みに失敗しました',
  // Trip Map Overlay
  'tripMap.overlay.title': '旅程マップ',
  'tripMap.overlay.filtering': 'フィルタ中',
  'tripMap.overlay.displayingLocations': '{count} 箇所の地点を表示',
  'tripMap.overlay.filteredByDay': '選択された日程のみ表示中',
  // Next Trip Map
  'nextTripMap.loadFailed': 'Google Maps APIの読み込みに失敗しました',
  // Plan Limits Display
  'planLimits.currentPlan': '現在のプラン',
  'planLimits.publicTemplate': '公開テンプレート',
  // Timezone Log Manager
  'timezoneLog.processed': '処理済み',
  'timezoneLog.latestBatchResults': '最新のバッチ更新結果',
  'timezoneLog.aboutBatchProcessing': 'バッチ処理について',
  // Country Map
  'countryMap.tripCount': '{count}回の旅行',
  // Inline Cost Editor
  'inlineCostEditor.amount': '金額',
  'inlineCostEditor.currency': '通貨',
  'inlineCostEditor.invalidAmount': '正しい金額を入力してください',
  'inlineCostEditor.saveHint': 'Enterで保存、Escapeでキャンセル',
  'inlineCostEditor.saving': '保存中...',
  // Inline Time Editor
  'inlineTimeEditor.startTime': '開始時間',
  'inlineTimeEditor.endTime': '終了時間',
  'inlineTimeEditor.timezone': 'タイムゾーン',
  'inlineTimeEditor.invalidFormat': '正しい時間形式で入力してください (例: 16:00)',
  'inlineTimeEditor.saveHint': 'Enterで保存、Escapeでキャンセル',
  'inlineTimeEditor.saving': '保存中...',
  // Timezone Options
  'timezone.UTC': 'UTC',
  'timezone.japan_tokyo': '日本 (Tokyo)',
  'timezone.america_new_york': 'アメリカ (New York)',
  'timezone.america_los_angeles': 'アメリカ (Los Angeles)',
  'timezone.europe_london': 'イギリス (London)',
  'timezone.europe_paris': 'フランス (Paris)',
  'timezone.asia_seoul': '韓国 (Seoul)',
  'timezone.asia_shanghai': '中国 (Shanghai)',
  'timezone.asia_hong_kong': '香港 (Hong Kong)',
  'timezone.asia_singapore': 'シンガポール (Singapore)',
  'timezone.asia_bangkok': 'タイ (Bangkok)',
  'timezone.asia_kolkata': 'インド (Kolkata)',
  'timezone.australia_sydney': 'オーストラリア (Sydney)',
  'timezone.pacific_honolulu': 'ハワイ (Honolulu)',
  'timezone.pacific_guam': 'グアム (Guam)',
  'timezone.pacific_saipan': 'サイパン (Saipan)',
  // Add Schedule Modal
  'addScheduleModal.title': 'Venue / Point of Interest を追加',
  'addScheduleModal.searchLabel': '場所を検索',
  'addScheduleModal.searchPlaceholder': '例: 東京タワー, 浅草寺, 銀座...',
  'addScheduleModal.searchButton': '検索',
  'addScheduleModal.searching': '検索中...',
  'addScheduleModal.searchResults': '検索結果',
  'addScheduleModal.tryDifferentKeyword': '別のキーワードで検索してみてください',
  // User Settings Page
  'userSettingsPage.saveSuccess': '設定を保存しました',
  'userSettingsPage.saveFailed': '設定の保存に失敗しました',
  'userSettingsPage.saveButton': '設定を保存',
  'userSettingsPage.saving': '保存中...',
  // Admin Failure Logs Page
  'adminFailureLogs.processed': '処理済み',
  'adminFailureLogs.aboutThisPage': 'このページについて',
  // Country Stats
  'countryStats.noTrips': 'まだ旅行がありません',
  'countryStats.recommendedTrips': 'おすすめ旅行計画',
  // Recommended Trips
  'recommendedTrips.title': 'おすすめ旅行計画',
  // Premium Feature
  'premium.unlimitedTrips': '無制限の旅行計画',
  'premium.allPremiumFeatures': 'プレミアム機能すべて',
  // Trip Slug Page
  'tripSlugPage.pdfRequiresBackpacker': 'PDF出力にはBackpackerプラン以上が必要です。',
  'tripSlugPage.pdfExportFailed': 'PDF出力に失敗しました。',
  'tripSlugPage.fetchTripFailed': '旅行データの取得に失敗しました',
  'tripSlugPage.fetchTripFailedDescription': '旅行データの読み込み中に問題が発生しました。もう一度お試しください。',
  'tripSlugPage.notFoundDescription': '該当する旅行が見つからないか、アクセス権がありません。',
  'tripSlugPage.addDayFailed': '日程の追加に失敗しました',
  'tripSlugPage.addPOIFailed': 'POIの追加に失敗しました',
  'tripSlugPage.orderUpdateFailed': '順序の更新に失敗しました',
  // Trip New Page
  'tripNew.dateValidation': '出発日は帰宅日より前の日付を選択してください',
  'tripNew.destinationRequired': '目的地を入力してください。',
  'tripNew.startDateRequired': '出発日を選択してください。',
  'tripNew.endDateRequired': '帰宅日を選択してください。',
  'tripNew.title': '新しい旅行を作成',
  'tripNew.destinationPlaceholder': '目的地を検索...',
  'tripNew.titlePlaceholder': '例: 沖縄旅行（空欄の場合は目的地が使用されます）',
  'tripNew.descriptionPlaceholder': '旅行の詳細や目的を記入してください',
  'tripNew.accessLevel.private': '非公開（自分と共有ユーザーのみ）',
  'tripNew.accessLevel.public': '公開（誰でも閲覧可能）',
  'tripNew.createButton': '旅行を作成',
  'tripNew.creating': '作成中...',
  // Not Found Page
  'notFound.title': 'ページが見つかりません',
  // Image Gallery
  'gallery.previousImage': '前の画像',
  'gallery.nextImage': '次の画像',
  'gallery.cached': 'キャッシュ済み',
  'gallery.photosOf': '{name} の写真',
  'gallery.photoCount': '+{count}枚',
  // Activity Categories (minimal set; fallback supported)
  'activity.primary.transportation': '移動・交通',
  'activity.primaryShort.transportation': '移動',
  'activity.primary.shopping': '買い物をする',
  'activity.primaryShort.shopping': '買い物',
  'activity.primary.dining': '食事をする',
  'activity.primaryShort.dining': '食事',
  'activity.primary.accommodation': '宿泊する',
  'activity.primaryShort.accommodation': '宿泊',
  'activity.primary.exploration': '探索する',
  'activity.primaryShort.exploration': '探索',
  'activity.primary.adventure': '探検する',
  'activity.primaryShort.adventure': '探検',
  'activity.primary.entertainment': '遊ぶ',
  'activity.primaryShort.entertainment': '遊ぶ',
  'activity.primary.culture': '文化に触れる',
  'activity.primaryShort.culture': '文化',
  'activity.primary.wellness': '健康志向',
  'activity.primaryShort.wellness': '健康',
  'activity.primary.service': 'サービス提供',
  'activity.primaryShort.service': 'サービス',
  // Activity Secondary Categories - Transportation
  'activity.secondary.transportation.flight': '飛行機',
  'activity.secondary.transportation.flight.description': '国際線・国内線の搭乗',
  'activity.secondary.transportation.train': '電車',
  'activity.secondary.transportation.train.description': '鉄道・地下鉄での移動',
  'activity.secondary.transportation.bus': 'バス',
  'activity.secondary.transportation.bus.description': '高速バス・市内バス',
  'activity.secondary.transportation.taxi': 'タクシー',
  'activity.secondary.transportation.taxi.description': 'タクシー・配車サービス',
  'activity.secondary.transportation.car_rental': 'レンタカー',
  'activity.secondary.transportation.car_rental.description': 'レンタカーでの移動',
  'activity.secondary.transportation.personal_car': 'マイカー',
  'activity.secondary.transportation.personal_car.description': '自家用車での移動',
  'activity.secondary.transportation.parking': '駐車場',
  'activity.secondary.transportation.parking.description': '駐車場の予約・精算・駐車位置の管理',
  'activity.secondary.transportation.ferry': 'フェリー',
  'activity.secondary.transportation.ferry.description': '船・フェリーでの移動',
  'activity.secondary.transportation.bike': '自転車',
  'activity.secondary.transportation.bike.description': 'レンタサイクル',
  'activity.secondary.transportation.scooter': 'バイク・スクーター',
  'activity.secondary.transportation.scooter.description': 'バイク・電動スクーター',
  'activity.secondary.transportation.gas_station': 'ガソリンスタンド',
  'activity.secondary.transportation.gas_station.description': '給油・ガソリンスタンド',
  'activity.secondary.transportation.toll_payment': '交通料金支払い',
  'activity.secondary.transportation.toll_payment.description': '高速道路料金・通行料金の支払い',
  // Shopping
  'activity.secondary.shopping.souvenir': 'お土産購入',
  'activity.secondary.shopping.souvenir.description': 'お土産・記念品の購入',
  'activity.secondary.shopping.grocery': '食料品購入',
  'activity.secondary.shopping.grocery.description': 'スーパー・コンビニでの買い物',
  'activity.secondary.shopping.fashion': 'ファッション',
  'activity.secondary.shopping.fashion.description': '衣類・アクセサリーの購入',
  'activity.secondary.shopping.electronics': '電化製品',
  'activity.secondary.shopping.electronics.description': '家電・ガジェットの購入',
  'activity.secondary.shopping.local_market': 'ローカル市場',
  'activity.secondary.shopping.local_market.description': '地元の市場・バザール',
  'activity.secondary.shopping.duty_free': '免税店',
  'activity.secondary.shopping.duty_free.description': '空港・市内の免税店',
  'activity.secondary.shopping.bookstore': '書店',
  'activity.secondary.shopping.bookstore.description': '書籍・雑誌の購入',
  // Dining
  'activity.secondary.dining.breakfast': '朝食',
  'activity.secondary.dining.breakfast.description': 'ホテル朝食・カフェ朝食',
  'activity.secondary.dining.lunch': '昼食',
  'activity.secondary.dining.lunch.description': 'ランチ・軽食',
  'activity.secondary.dining.dinner': '夕食',
  'activity.secondary.dining.dinner.description': 'ディナー・夜のレストラン',
  'activity.secondary.dining.cafe': 'カフェ',
  'activity.secondary.dining.cafe.description': 'カフェ・喫茶店',
  'activity.secondary.dining.bar': 'バー',
  'activity.secondary.dining.bar.description': 'バー・パブ',
  'activity.secondary.dining.food_tour': 'フードツアー',
  'activity.secondary.dining.food_tour.description': '食べ歩き・グルメツアー',
  'activity.secondary.dining.street_food': '屋台・ストリートフード',
  'activity.secondary.dining.street_food.description': '屋台・フードトラック',
  'activity.secondary.dining.fine_dining': 'ファインダイニング',
  'activity.secondary.dining.fine_dining.description': '高級レストラン',
  // Accommodation
  'activity.secondary.accommodation.check_in': 'チェックイン作業',
  'activity.secondary.accommodation.check_in.description': 'ホテル・宿泊施設のチェックイン',
  'activity.secondary.accommodation.check_out': 'チェックアウト作業',
  'activity.secondary.accommodation.check_out.description': 'ホテル・宿泊施設のチェックアウト',
  'activity.secondary.accommodation.car_camping': '車中泊',
  'activity.secondary.accommodation.car_camping.description': '車での宿泊',
  'activity.secondary.accommodation.camping': 'キャンプ',
  'activity.secondary.accommodation.camping.description': 'テント・キャンプ場での宿泊',
  'activity.secondary.accommodation.hostel_stay': 'ホステル泊',
  'activity.secondary.accommodation.hostel_stay.description': 'ホステル・ゲストハウス',
  'activity.secondary.accommodation.airbnb': '民泊',
  'activity.secondary.accommodation.airbnb.description': 'Airbnb・民泊施設',
  'activity.secondary.accommodation.luxury_hotel': '高級ホテル',
  'activity.secondary.accommodation.luxury_hotel.description': '5つ星ホテル・リゾート',
  // Exploration
  'activity.secondary.exploration.city_walk': '街歩き',
  'activity.secondary.exploration.city_walk.description': '市内・町の散策',
  'activity.secondary.exploration.nature_walk': '自然散策',
  'activity.secondary.exploration.nature_walk.description': '公園・自然の中の散歩',
  'activity.secondary.exploration.photography': '写真撮影',
  'activity.secondary.exploration.photography.description': '景観・建物の撮影',
  'activity.secondary.exploration.observation': '展望・眺望',
  'activity.secondary.exploration.observation.description': '展望台・景色を楽しむ',
  'activity.secondary.exploration.architecture': '建築鑑賞',
  'activity.secondary.exploration.architecture.description': '建築物の見学',
  'activity.secondary.exploration.park': '公園訪問',
  'activity.secondary.exploration.park.description': '公園・庭園の訪問',
  // Adventure
  'activity.secondary.adventure.hiking': 'ハイキング',
  'activity.secondary.adventure.hiking.description': '登山道・トレイルハイキング',
  'activity.secondary.adventure.trekking': 'トレッキング',
  'activity.secondary.adventure.trekking.description': '山岳トレッキング',
  'activity.secondary.adventure.diving': 'ダイビング',
  'activity.secondary.adventure.diving.description': 'スキューバダイビング',
  'activity.secondary.adventure.snorkeling': 'シュノーケリング',
  'activity.secondary.adventure.snorkeling.description': 'シュノーケリング',
  'activity.secondary.adventure.rock_climbing': 'ロッククライミング',
  'activity.secondary.adventure.rock_climbing.description': 'クライミング・ボルダリング',
  'activity.secondary.adventure.caving': '洞窟探検',
  'activity.secondary.adventure.caving.description': '洞窟・ケイビング',
  'activity.secondary.adventure.safari': 'サファリ',
  'activity.secondary.adventure.safari.description': 'サファリツアー・動物観察',
  'activity.secondary.adventure.jungle_trek': 'ジャングルトレック',
  'activity.secondary.adventure.jungle_trek.description': 'ジャングル・熱帯雨林の探検',
  // Entertainment
  'activity.secondary.entertainment.theme_park': 'テーマパーク',
  'activity.secondary.entertainment.theme_park.description': '遊園地・テーマパーク',
  'activity.secondary.entertainment.beach': 'ビーチ',
  'activity.secondary.entertainment.beach.description': 'ビーチ・海水浴',
  'activity.secondary.entertainment.water_sports': 'ウォータースポーツ',
  'activity.secondary.entertainment.water_sports.description': 'サーフィン・カヤックなど',
  'activity.secondary.entertainment.casino': 'カジノ',
  'activity.secondary.entertainment.casino.description': 'カジノ・ギャンブル',
  'activity.secondary.entertainment.nightlife': 'ナイトライフ',
  'activity.secondary.entertainment.nightlife.description': 'ナイトクラブ・バー巡り',
  'activity.secondary.entertainment.game_center': 'ゲームセンター',
  'activity.secondary.entertainment.game_center.description': 'アーケード・ゲームセンター',
  'activity.secondary.entertainment.karaoke': 'カラオケ',
  'activity.secondary.entertainment.karaoke.description': 'カラオケ・歌',
  'activity.secondary.entertainment.movie': '映画鑑賞',
  'activity.secondary.entertainment.movie.description': '映画館・シネマ',
  // Culture
  'activity.secondary.culture.museum': '博物館',
  'activity.secondary.culture.museum.description': '博物館・科学館',
  'activity.secondary.culture.art_gallery': '美術館',
  'activity.secondary.culture.art_gallery.description': '美術館・ギャラリー',
  'activity.secondary.culture.aquarium': '水族館',
  'activity.secondary.culture.aquarium.description': '海洋生物の展示・学習施設',
  'activity.secondary.culture.temple_shrine': '寺社仏閣',
  'activity.secondary.culture.temple_shrine.description': '寺院・神社・教会',
  'activity.secondary.culture.historical_site': '歴史的建造物',
  'activity.secondary.culture.historical_site.description': '城・遺跡・史跡',
  'activity.secondary.culture.local_festival': '地域祭り',
  'activity.secondary.culture.local_festival.description': '祭り・フェスティバル',
  'activity.secondary.culture.theater': '劇場・コンサート',
  'activity.secondary.culture.theater.description': '演劇・音楽コンサート',
  'activity.secondary.culture.traditional_experience': '伝統文化体験',
  'activity.secondary.culture.traditional_experience.description': '茶道・書道などの体験',
  'activity.secondary.culture.workshop': 'ワークショップ',
  'activity.secondary.culture.workshop.description': '工芸・アート体験',
  // Wellness
  'activity.secondary.wellness.spa': 'スパ',
  'activity.secondary.wellness.spa.description': 'スパ・温泉',
  'activity.secondary.wellness.massage': 'マッサージ',
  'activity.secondary.wellness.massage.description': 'マッサージ・リラクゼーション',
  'activity.secondary.wellness.yoga': 'ヨガ',
  'activity.secondary.wellness.yoga.description': 'ヨガ・瞑想クラス',
  'activity.secondary.wellness.gym': 'ジム',
  'activity.secondary.wellness.gym.description': 'フィットネスジム',
  'activity.secondary.wellness.meditation': '瞑想',
  'activity.secondary.wellness.meditation.description': '瞑想・マインドフルネス',
  'activity.secondary.wellness.hot_spring': '温泉',
  'activity.secondary.wellness.hot_spring.description': '温泉・銭湯',
  'activity.secondary.wellness.detox': 'デトックス',
  'activity.secondary.wellness.detox.description': 'デトックス・ファスティング',
  // Service
  'activity.secondary.service.laundry': '洗濯',
  'activity.secondary.service.laundry.description': 'コインランドリー・クリーニング',
  'activity.secondary.service.currency_exchange': '両替',
  'activity.secondary.service.currency_exchange.description': '両替所・銀行',
  'activity.secondary.service.hospital': '病院',
  'activity.secondary.service.hospital.description': '病院・クリニック',
  'activity.secondary.service.visa_application': 'ビザ申請',
  'activity.secondary.service.visa_application.description': '大使館・ビザセンター',
  'activity.secondary.service.sim_purchase': 'SIM購入',
  'activity.secondary.service.sim_purchase.description': 'SIMカード・通信サービス',
  'activity.secondary.service.post_office': '郵便局',
  'activity.secondary.service.post_office.description': '郵便・荷物発送',
  'activity.secondary.service.atm': 'ATM',
  'activity.secondary.service.atm.description': '現金引き出し',
  'activity.secondary.service.baggage_storage': '荷物預け',
  'activity.secondary.service.baggage_storage.description': 'コインロッカー・荷物預かり',
  // Currency Names
  'currency.JPY.name': '日本円',
  'currency.JPY.country': '日本',
  'currency.USD.name': '米ドル',
  'currency.USD.country': 'アメリカ',
  'currency.EUR.name': 'ユーロ',
  'currency.EUR.country': 'ヨーロッパ',
  'currency.GBP.name': '英ポンド',
  'currency.GBP.country': 'イギリス',
  'currency.KRW.name': '韓国ウォン',
  'currency.KRW.country': '韓国',
  'currency.CNY.name': '中国元',
  'currency.CNY.country': '中国',
  'currency.HKD.name': '香港ドル',
  'currency.HKD.country': '香港',
  'currency.SGD.name': 'シンガポールドル',
  'currency.SGD.country': 'シンガポール',
  'currency.THB.name': 'タイバーツ',
  'currency.THB.country': 'タイ',
  'currency.TWD.name': '台湾ドル',
  'currency.TWD.country': '台湾',
  'currency.AUD.name': '豪ドル',
  'currency.AUD.country': 'オーストラリア',
  'currency.CAD.name': 'カナダドル',
  'currency.CAD.country': 'カナダ',
  'currency.CHF.name': 'スイスフラン',
  'currency.CHF.country': 'スイス',
  'currency.INR.name': 'インドルピー',
  'currency.INR.country': 'インド',
  'currency.MYR.name': 'マレーシアリンギット',
  'currency.MYR.country': 'マレーシア',
  'currency.IDR.name': 'インドネシアルピア',
  'currency.IDR.country': 'インドネシア',
  'currency.PHP.name': 'フィリピンペソ',
  'currency.PHP.country': 'フィリピン',
  'currency.VND.name': 'ベトナムドン',
  'currency.VND.country': 'ベトナム',
  'currency.MXN.name': 'メキシコペソ',
  'currency.MXN.country': 'メキシコ',
  'currency.SEK.name': 'スウェーデンクローナ',
  'currency.SEK.country': 'スウェーデン',
  'currency.NOK.name': 'ノルウェークローネ',
  'currency.NOK.country': 'ノルウェー',
  'currency.DKK.name': 'デンマーククローネ',
  'currency.DKK.country': 'デンマーク',
  'currency.PLN.name': 'ポーランドズロチ',
  'currency.PLN.country': 'ポーランド',
  'currency.CZK.name': 'チェココルナ',
  'currency.CZK.country': 'チェコ',
  'currency.HUF.name': 'ハンガリーフォリント',
  'currency.HUF.country': 'ハンガリー',
  'currency.RUB.name': 'ロシアルーブル',
  'currency.RUB.country': 'ロシア',
  'currency.AED.name': 'アラブ首長国連邦ディルハム',
  'currency.AED.country': 'UAE',
  'currency.SAR.name': 'サウジアラビアリヤル',
  'currency.SAR.country': 'サウジアラビア',
  'currency.ILS.name': 'イスラエルシェケル',
  'currency.ILS.country': 'イスラエル',
  'currency.TRY.name': 'トルコリラ',
  'currency.TRY.country': 'トルコ',
  'currency.ZAR.name': '南アフリカランド',
  'currency.ZAR.country': '南アフリカ',
  'currency.BRL.name': 'ブラジルレアル',
  'currency.BRL.country': 'ブラジル',
  'currency.ARS.name': 'アルゼンチンペソ',
  'currency.ARS.country': 'アルゼンチン',
  'currency.CLP.name': 'チリペソ',
  'currency.CLP.country': 'チリ',
  'currency.COP.name': 'コロンビアペソ',
  'currency.COP.country': 'コロンビア',
  'currency.PEN.name': 'ペルーソル',
  'currency.PEN.country': 'ペルー',
  'currency.NZD.name': 'ニュージーランドドル',
  'currency.NZD.country': 'ニュージーランド',
  // Travel Cost Display
  'cost.title': '旅行費用',
  'cost.empty': '費用情報が設定されたスケジュールがありません',
  'cost.empty.description': '各スケジュールに費用を設定すると、総費用が表示されます',
  'cost.items': '件',
  'cost.total': '合計',
  'cost.hint.edit': '各スケジュールの費用をクリックして編集できます',
  'cost.viewDetails': '明細を見る',
  'cost.collapse': '折りたたむ',
  // Date formatting
  'date.notSet': '日付が設定されていません',
  'date.daysLater': '日後',
  'date.days': '日間',
  'date.dayTrip': '日帰り',
  'date.yearsAgo': '年前',
  'date.monthsAgo': 'ヶ月前',
  'date.thisMonth': '今月',
  'date.year': '年',
  'date.month': '月',
  'date.day': '日',
  // Weather Forecast
  'weather.title': '天気予報',
  'weather.loading': '天気情報を取得中...',
  'weather.error.fetchFailed': '天気情報の取得に失敗しました',
  'weather.error.notAvailable': '天気情報を取得できませんでした',
  'weather.empty.noData': '天気情報を取得できませんでした',
  'weather.empty.noDestination': '旅行の日程と目的地を設定すると天気予報が表示されます',
  'weather.hint.forecastLimit': '💡 天気予報は16日以内の日程のみ対応',
  'weather.partialForecast': '部分的な予報',
  'weather.constraint.title': '予報期間の制約',
  'weather.constraint.message': '天気予報は{forecastDays}日分のみ取得可能です。',
  'weather.constraint.remainingDays': '旅行期間の残り{remainingDays}日分は表示されていません。',
  'weather.rainyDays': '雨の日',
  'weather.averageWindSpeed': '平均風速',
  'weather.average': '平均',
  'weather.range': '〜',
  'weather.days': '日',
  'weather.only': 'のみ',
  'weather.unknown': '不明',
  'weather.forecastedBy': 'Open-Meteo による予報',
  // Units
  'unit.mm': 'mm',
  'unit.kmh': 'km/h',
  'unit.km': 'km',
  'unit.hour': '時間',
  'unit.minute': '分',
  // Weather Codes (WMO Weather Interpretation Codes)
  'weather.code.0': '晴れ',
  'weather.code.1': '主に晴れ',
  'weather.code.2': '部分的に曇り',
  'weather.code.3': '曇り',
  'weather.code.45': '霧',
  'weather.code.48': '霧氷',
  'weather.code.51': '軽い霧雨',
  'weather.code.53': '霧雨',
  'weather.code.55': '濃い霧雨',
  'weather.code.56': '軽い凍る霧雨',
  'weather.code.57': '凍る霧雨',
  'weather.code.61': '軽い雨',
  'weather.code.63': '雨',
  'weather.code.65': '大雨',
  'weather.code.66': '軽い凍る雨',
  'weather.code.67': '凍る雨',
  'weather.code.71': '軽い雪',
  'weather.code.73': '雪',
  'weather.code.75': '大雪',
  'weather.code.77': '雪の粒',
  'weather.code.80': '軽いにわか雨',
  'weather.code.81': 'にわか雨',
  'weather.code.82': '激しいにわか雨',
  'weather.code.85': '軽いにわか雪',
  'weather.code.86': 'にわか雪',
  'weather.code.95': '雷雨',
  'weather.code.96': '雹を伴う雷雨',
  'weather.code.99': '激しい雹を伴う雷雨',
  // Create Trip Dialog
  'trip.create.title': '新しい旅行を作成',
  'trip.create.destination.label': '目的地 *',
  'trip.create.destination.placeholder': '目的地を検索（例: 東京、パリ、ニューヨーク）',
  'trip.create.destination.hint': '目的地はGoogle Placesから選択してください',
  'trip.create.startDate.label': '出発日 *',
  'trip.create.endDate.label': '帰宅日 *',
  'trip.create.dateError': '日付エラー',
  'trip.create.dateValidation.startBeforeEnd': '出発日は帰宅日より前の日付を選択してください',
  'trip.create.dateAutoAdjusted': '帰宅日を出発日と同じ日付に自動調整しました',
  'trip.create.advancedSettings': '詳細設定',
  'trip.create.mode.label': '作成したいものを選択してください',
  'trip.create.mode.trip': '自分用の旅行を作成する',
  'trip.create.mode.tripDescription': '具体的な旅行日を設定し、公開したくなるまでプライベートのまま管理します。',
  'trip.create.mode.template': 'テンプレートを作成する',
  'trip.create.mode.templateDescription': '日付ではなく日数だけで構成された再利用しやすいプランを作成できます。準備が整ったら公開できます。',
  'trip.create.mode.templateDescriptionLocked': '公開テンプレートを作成するには対応プランへのアップグレードが必要です。',
  'trip.create.mode.templateUpgradeHint': 'アップグレードが必要です',
  'trip.create.visibilityNotice': '旅行はすべて非公開で開始します。公開したいタイミングでいつでも「公開」に切り替えられます。',
  'trip.create.title.label': '旅行のタイトル（未入力時は目的地が使用されます）',
  'trip.create.title.placeholder': '例: 沖縄旅行（空欄の場合は目的地が使用されます）',
  'trip.create.description.label': '説明',
  'trip.create.description.placeholder': '旅行の詳細や目的を記入してください',
  'trip.create.imageLoading': '目的地に関連する画像を自動取得中...',
  'trip.create.imageLoaded': '目的地に関連する画像を自動取得しました',
  'trip.create.accessLevel.label': '公開設定',
  'trip.create.accessLevel.private.label': 'プライベート（自分用計画）',
  'trip.create.accessLevel.private.description': '自分の旅行を作成する際に使用します。自分と招待した友人だけが閲覧できます。',
  'trip.create.accessLevel.public.description': '旅行データを周りに紹介する場合に使用します。誰でも閲覧できる公開モードです。',
  'trip.create.templateMode.label': 'テンプレートとして公開する',
  'trip.create.templateMode.description.active': 'テンプレートモードでは旅行日ではなく日数のみを設定します。いつでも使い回せる紹介用プランに最適です。',
  'trip.create.templateMode.description.inactive': '自分用の旅行を作成する場合はテンプレートモードをオフのままにしてください。',
  'trip.create.dayCount.label': '日数',
  'trip.create.dayCount.placeholder': '例: 5',
  'trip.create.dayCount.description': 'テンプレートが想定している日数を入力してください。複製後に具体的な日付を設定できます。',
  'trip.create.validation.dayCountRequired': 'テンプレートには日数の入力が必要です。',
  'trip.template.upgradeRequired': '公開テンプレートを作成するには Backpacker 以上のプランが必要です。',
  'trip.template.replicate': 'このテンプレートから自分の旅行を作成',
  'trip.template.replicating': 'コピー中…',
  'trip.template.replicateFailed': 'テンプレートからのレプリカ作成に失敗しました。',
  'trip.template.replicateDialogTitle': 'テンプレートを読み込んで旅を始める',
  'trip.template.replicateStartDateLabel': '旅の開始日を選択してください *',
  'trip.template.replicateDayCountSummary': 'このテンプレートは {{dayCount}} 日構成です。終了日は自動で入力されます。',
  'trip.template.replicateEndDatePreview': '終了日は自動的に {{endDate}} に設定されます。',
  'trip.template.replicateEndDateHint': '開始日を選ぶと終了日が自動計算されます。',
  'trip.template.replicateStartDateError': '開始日を選択してください。',
  'trip.publish.button': '旅行を公開する',
  'trip.publish.templateButton': 'テンプレートを公開する',
  'trip.publish.publishing': '公開中…',
  'trip.publish.templatePublishing': 'テンプレートを公開中…',
  'trip.publish.success': '公開しました。',
  'trip.publish.failed': '公開に失敗しました。もう一度お試しください。',
  'trip.likes.loading': 'いいねを読み込み中…',
  'trip.likes.button.like': 'いいねする',
  'trip.likes.button.liked': 'いいね済み',
  'trip.likes.loginRequired': 'いいねするにはログインしてください。',
  'trip.likes.error': 'いいねの更新に失敗しました。もう一度お試しください。',
  'trip.likes.count': 'いいね {{count}} 件',
  'trip.create.cancel': 'キャンセル',
  'trip.create.submitting': '作成中...',
  'trip.create.submit': '旅行を作成',
  'trip.create.validation.destinationRequired': '目的地を選択してください。Google Placesから場所を検索して選択してください。',
  'trip.create.validation.startDateRequired': '出発日を選択してください。',
  'trip.create.validation.endDateRequired': '帰宅日を選択してください。',
  'trip.create.startDate.placeholder': 'YYYY年MM月DD日',
  'trip.create.startDate.hint': '例: 2024年12月25日',
  'trip.create.endDate.placeholder': 'YYYY年MM月DD日',
  'trip.create.endDate.hint': '例: 2024年12月31日',
  // Checklist
  'checklist.title': 'Travel Checklist',
  'checklist.applyPreset': 'プリセットを適用',
  'checklist.myPresets': 'マイプリセット',
  'checklist.saveAsPreset': 'プリセットとして保存',
  'checklist.regenerating': '生成中...',
  'checklist.regenerate': 'チェックリストを再生成',
  'checklist.loading': '読み込み中...',
  'checklist.preparing.title': '行動系準備（Preparing）',
  'checklist.preparing.subtitle': '行動系のこと',
  'checklist.packing.title': 'パッキング系（Packing）',
  'checklist.packing.subtitle': '持っていくものの準備系',
  'checklist.noItems': '該当項目はありません',
  'checklist.delete': '削除',
  'checklist.addCustom.placeholder': 'カスタム項目を追加',
  'checklist.addCustom.add': '追加',
  'checklist.preset.saveSuccess': 'プリセットを保存しました',
  'checklist.preset.applySuccess': 'プリセットを適用しました',
  'checklist.preset.saveModal.title': 'チェックリストをプリセットとして保存',
  'checklist.preset.saveModal.titleLabel': 'タイトル',
  'checklist.preset.saveModal.titlePlaceholder': '例: 冬の北海道旅行',
  'checklist.preset.saveModal.descriptionLabel': '説明',
  'checklist.preset.saveModal.descriptionPlaceholder': '例: スキー・温泉旅行向けのチェックリスト',
  'checklist.preset.saveModal.tagsLabel': 'タグ（カンマ区切り）',
  'checklist.preset.saveModal.tagsPlaceholder': '例: winter, hokkaido, skiing',
  'checklist.preset.saveModal.isPublic': '公開する（他のユーザーが利用可能）',
  'checklist.preset.saveModal.cancel': 'キャンセル',
  'checklist.preset.saveModal.saving': '保存中...',
  'checklist.preset.saveModal.save': '保存',
  'checklist.preset.saveModal.titleRequired': 'タイトルを入力してください',
  'checklist.preset.saveModal.saveFailed': 'プリセットの保存に失敗しました',
  'checklist.myPresets.title': 'マイプリセット',
  'checklist.myPresets.loading': '読み込み中...',
  'checklist.myPresets.empty': 'プリセットがありません',
  'checklist.myPresets.public': '公開',
  'checklist.myPresets.private': '非公開',
  'checklist.myPresets.usageCount': '使用回数',
  'checklist.myPresets.itemsCount': '項目',
  'checklist.myPresets.delete': '削除',
  'checklist.myPresets.close': '閉じる',
  'checklist.myPresets.deleteConfirm': 'このプリセットを削除しますか？',
  'checklist.myPresets.deleteFailed': '削除に失敗しました',
  'checklist.library.title': 'チェックリストプリセットを選択',
  'checklist.library.searchPlaceholder': 'キーワード、タグで検索...',
  'checklist.library.sortPopular': '人気順',
  'checklist.library.sortRecent': '新着順',
  'checklist.library.loading': '読み込み中...',
  'checklist.library.empty': 'プリセットが見つかりません',
  'checklist.library.apply': '適用',
  'checklist.library.close': '閉じる',
  'checklist.library.applyFailed': 'プリセットの適用に失敗しました',
  'checklist.nav.preparing.title': '準備（行動）',
  'checklist.nav.preparing.subtitle': '行動系のこと',
  'checklist.nav.packing.title': 'パッキング',
  'checklist.nav.packing.subtitle': '持っていくものの準備系',
  // Loading messages
  'loading.message': '読み込み中...',
  'loading.mapLoading': '地図を読み込み中...',
  'loading.saving': '保存中...',
  'loading.calculating': '計算中...',
  'loading.addingSchedule': 'スケジュールを追加中...',
  'loading.updating': '保存中...',
  'loading.updatingDescription': '日程を更新しています',
  // Reservation Categories
  'reservation.type.flight': '飛行機',
  'reservation.type.rentalCar': 'レンタカー',
  'reservation.type.hotel': 'ホテル',
  'reservation.type.dining': '食事',
  'reservation.type.other': 'その他',
  'reservation.site.expedia': 'Expedia',
  'reservation.site.bookingCom': 'Booking.com',
  'reservation.site.agoda': 'Agoda',
  'reservation.site.trivago': 'Trivago',
  'reservation.site.airbnb': 'Airbnb',
  'reservation.site.kayak': 'Kayak',
  'reservation.site.skyscanner': 'Skyscanner',
  'reservation.site.tripadvisor': 'TripAdvisor',
  'reservation.site.opentable': 'OpenTable',
  'reservation.site.tabelog': '食べログ',
  'reservation.site.hotPepper': 'ホットペッパー',
  'reservation.site.ana': 'ANA',
  'reservation.site.jal': 'JAL',
  'reservation.site.rakutenTravel': '楽天トラベル',
  'reservation.site.jalan': 'じゃらん',
  'reservation.site.other': 'その他',
  'reservation.selectSite': '選択してください',
  'reservation.notSet': '未設定',
  'reservation.modal.editTitle': '予約情報を編集',
  'reservation.modal.addTitle': '予約情報を追加',
  'reservation.modal.loadTemplate': 'テンプレートから読み込む',
  'reservation.modal.template': 'テンプレート',
  'reservation.modal.saveAsTemplate': 'テンプレートとして保存',
  'reservation.validation.airportCode': '空港コードは3文字の英大文字で入力してください（例: NRT, HND）',
  'reservation.validation.flightNumber': '便名は航空会社コード+数字の形式で入力してください（例: ANA123, JAL456）',
  'reservation.validation.typeRequired': '予約タイプは必須です',
  'reservation.validation.flightNumberRequired': '便名は必須です',
  'reservation.validation.departureAirportRequired': '出発空港は必須です',
  'reservation.validation.arrivalAirportRequired': '到着空港は必須です',
  'reservation.validation.departureDateRequired': '出発日時は必須です',
  'reservation.validation.arrivalDateRequired': '到着日時は必須です',
  'reservation.validation.startDateRequired': '開始日時は必須です',
  'reservation.validation.endDateRequired': '終了日時は必須です',
  'reservation.validation.reservationUrl': '予約URLはhttps://で始まる有効なURLにしてください',
  'reservation.validation.invalidStartOrEnd': '開始日時または終了日時が無効です',
  'reservation.validation.endAfterStart': '終了日時は開始日時より後に設定してください',
  'reservation.validation.invalidDepartureOrArrival': '出発日時または到着日時が無効です',
  'reservation.validation.arrivalAfterDeparture': '到着日時は出発日時より後に設定してください',
  'reservation.field.type': '予約タイプ',
  'reservation.field.flightNumber': '便名',
  'reservation.field.airline': '航空会社',
  'reservation.field.departureAirport': '出発空港',
  'reservation.field.arrivalAirport': '到着空港',
  'reservation.field.departureDateTime': '出発日時',
  'reservation.field.arrivalDateTime': '到着日時',
  'reservation.field.startDateTime': '開始日時',
  'reservation.field.endDateTime': '終了日時',
  'reservation.field.confirmationNumber': '予約確認番号',
  'reservation.field.reservationSite': '予約サイト',
  'reservation.field.reservationUrl': '予約サイトURL',
  'reservation.field.notes': 'メモ',
  'reservation.placeholder.flightNumber': '例: ANA123, JAL456',
  'reservation.placeholder.airline': '例: ANA, JAL',
  'reservation.placeholder.departureAirport': '例: NRT, HND',
  'reservation.placeholder.arrivalAirport': '例: ITM, KIX',
  'reservation.placeholder.confirmationNumber': '予約確認番号',
  'reservation.placeholder.notes': '追加のメモや情報',
  'reservation.button.cancel': 'キャンセル',
  'reservation.button.save': '保存',
  'reservation.button.saving': '保存中...',
  'reservation.action.openSite': '予約サイトを開く',
  'reservation.template.deleteFailed': 'テンプレートの削除に失敗しました',
  'reservation.template.deleteConfirm': 'このテンプレートを削除しますか？',
  'reservation.template.createFailed': 'テンプレートの作成に失敗しました',
  'reservation.template.updateFailed': 'テンプレートの更新に失敗しました',
  'reservation.template.empty': 'テンプレートがありません',
  'reservation.template.placeholder.name': '例: いつものANA便',
  'reservation.template.placeholder.description': 'このテンプレートの用途や特徴',
  'reservation.template.placeholder.notes': 'テンプレート使用時に自動入力されるメモ',
  'reservation.template.useButton': 'テンプレートを使用',
  'reservation.saveFailed': '予約情報の保存に失敗しました',
  'schedule.venue.deleteConfirm': 'このVenueを削除しますか？',
  'user.defaultName': 'ユーザー',
  'plan.seasonTraveler': 'Season Traveler',
  // User Settings Modal
  'userSettings.title': 'ユーザー設定',
  'userSettings.basicInfo': '基本情報',
  'userSettings.settings': '設定',
  'userSettings.label.name': '名前',
  'userSettings.label.email': 'メールアドレス',
  'userSettings.label.currency': '通貨',
  'userSettings.label.homeArea': 'ホームエリア（居住地）',
  'userSettings.label.homeCountry': '居住国',
  'userSettings.label.unitSystem': '単位系',
  'userSettings.unitSystem.metric': 'メートル法（摂氏、km/m）',
  'userSettings.unitSystem.imperial': 'ヤードポンド法（華氏、mi/ft）',
  'userSettings.description.unitSystem': '選択した単位系に応じて、温度と距離の単位が自動的に設定されます',
  'userSettings.label.timezone': 'タイムゾーン',
  'userSettings.label.language': '言語',
  'userSettings.label.theme': 'テーマ',
  'userSettings.label.notifications': '通知を受け取る',
  'userSettings.placeholder.name': '名前を入力してください',
  'userSettings.placeholder.currency': '例: JPY, USD, EUR',
  'userSettings.placeholder.homeArea': '自宅周辺の市区町村などを検索...',
  'userSettings.placeholder.timezone': '例: Asia/Tokyo',
  'userSettings.placeholder.select': '選択してください',
  'userSettings.placeholder.languageAuto': '自動（ブラウザ設定）',
  'userSettings.description.checkingSlug': 'スラッグの確認中...',
  'userSettings.description.homeAreaCountryCode': '選択した場所の国コードが自動的に判定されます',
  'userSettings.description.homeCountry': 'チェックリスト生成時に国際旅行かどうかを判定するために使用されます',
  'userSettings.description.language': '未選択の場合はブラウザの言語設定を使用します',
  'userSettings.validation.nameMinLength': '名前は4文字以上で入力してください',
  'userSettings.validation.nameAvailable': 'この名前は使用可能です',
  'userSettings.validation.slugCheckFailed': 'スラッグの確認に失敗しました',
  'userSettings.validation.nameDuplicate': '名前の重複エラーを解決してから保存してください',
  'userSettings.success.saved': '設定を保存しました',
  'userSettings.error.saveFailed': '設定の保存に失敗しました: {error}',
  'userSettings.error.saveFailedNetwork': '設定の保存に失敗しました: ネットワークエラー',
  'userSettings.error.unknown': '不明なエラー',
  'userSettings.button.cancel': 'キャンセル',
  'userSettings.button.save': '設定を保存',
  'userSettings.button.saving': '保存中...',
  'userSettings.theme.light': 'ライト',
  'userSettings.theme.dark': 'ダーク',
  // Trip Guide page
  'tripGuide.header.title': 'ガイド作成者ダッシュボード',
  'tripGuide.header.subtitle': 'ガイドの作成、管理、統計を一箇所で',
  'tripGuide.header.createGuide': '新規ガイドを作成',
  'tripGuide.tabs.draft': '執筆中',
  'tripGuide.tabs.published': '公開済み',
  'tripGuide.tabs.analytics': '統計',
  'tripGuide.draft.title': '執筆中のガイド',
  'tripGuide.draft.empty': '執筆中のガイドはありません',
  'tripGuide.draft.emptySubtitle': '新規ガイドを作成しましょう',
  'tripGuide.published.title': '公開済みガイド',
  'tripGuide.published.empty': '公開済みのガイドはありません',
  'tripGuide.published.emptySubtitle': '執筆中のガイドを公開すると、ここに表示されます',
  'tripGuide.card.public': 'Public',
  'tripGuide.card.sharedLink': 'Shared link',
  'tripGuide.card.draft': 'Draft',
  'tripGuide.card.untitled': 'Untitled Guide',
  'tripGuide.card.updated': '更新',
  'tripGuide.card.edit': '編集',
  'tripGuide.card.publish': '公開',
  'tripGuide.card.unpublish': '非公開',
  'tripGuide.card.analytics': '統計',
  'tripGuide.analytics.overview': '全体統計',
  'tripGuide.analytics.totalGuides': '総ガイド数',
  'tripGuide.analytics.publishedGuides': '公開済み',
  'tripGuide.analytics.draftGuides': '執筆中',
  'tripGuide.analytics.totalViews': '総閲覧数',
  'tripGuide.analytics.totalLikes': '総いいね数',
  'tripGuide.analytics.totalReplicas': '総複製数',
  'tripGuide.analytics.popularGuides': '人気ガイドランキング',
  'tripGuide.analytics.noPopularGuides': '公開済みのガイドがありません',
  'tripGuide.analytics.untitled': 'Untitled Guide',
  'tripGuide.analytics.views': '閲覧',
  'tripGuide.analytics.likes': 'いいね',
  'tripGuide.analytics.replicas': '複製',
  'tripGuide.modals.publish.title': 'ガイドを公開しますか？',
  'tripGuide.modals.publish.message': 'このガイドを公開すると、他のユーザーが閲覧・複製できるようになります。',
  'tripGuide.modals.publish.untitled': 'Untitled Guide',
  'tripGuide.modals.publish.publishing': '公開中...',
  'tripGuide.modals.publish.confirm': '公開する',
  'tripGuide.modals.publish.cancel': 'キャンセル',
  'tripGuide.modals.unpublish.title': 'ガイドを非公開にしますか？',
  'tripGuide.modals.unpublish.message': 'このガイドを非公開にすると、他のユーザーが閲覧できなくなります。既に複製されたガイドには影響しません。',
  'tripGuide.modals.unpublish.untitled': 'Untitled Guide',
  'tripGuide.modals.unpublish.unpublishing': '非公開中...',
  'tripGuide.modals.unpublish.confirm': '非公開にする',
  'tripGuide.modals.unpublish.cancel': 'キャンセル',
  'tripGuide.modals.delete.title': 'ガイドを削除しますか？',
  'tripGuide.modals.delete.message': 'この操作は取り消せません。ガイドとそのすべてのデータが永久に削除されます。',
  'tripGuide.modals.delete.untitled': 'Untitled Guide',
  'tripGuide.modals.delete.deleting': '削除中...',
  'tripGuide.modals.delete.confirm': '削除する',
  'tripGuide.modals.delete.cancel': 'キャンセル',
  // Country names (common countries)
  'country.JP': '日本',
  'country.US': 'アメリカ合衆国',
  'country.CA': 'カナダ',
  'country.AU': 'オーストラリア',
  'country.NZ': 'ニュージーランド',
  'country.GB': 'イギリス',
  'country.DE': 'ドイツ',
  'country.FR': 'フランス',
  'country.IT': 'イタリア',
  'country.ES': 'スペイン',
  'country.KR': '韓国',
  'country.CN': '中国',
  'country.TW': '台湾',
  'country.HK': '香港',
  'country.SG': 'シンガポール',
  'country.TH': 'タイ',
  'country.MY': 'マレーシア',
  'country.ID': 'インドネシア',
  'country.PH': 'フィリピン',
  'country.VN': 'ベトナム',
  'country.IN': 'インド',
}

const dictionaries: Record<SupportedLanguage, Dictionary> = {
  en,
  ja,
  zh: en,
  ko: en,
  es: en,
  fr: en,
  de: en,
  it: en,
  pt: en,
}

export function t(key: TranslationKey, variables?: Record<string, string | number> | SupportedLanguage, lang?: SupportedLanguage): string {
  // 後方互換性: 2番目の引数がlanguageの場合
  let actualLang: SupportedLanguage
  let actualVariables: Record<string, string | number> | undefined
  
  if (typeof variables === 'string') {
    // t(key, 'ja') の形式
    actualLang = variables
    actualVariables = undefined
  } else {
    // t(key, { dayCount: 3 }) または t(key, { dayCount: 3 }, 'ja') の形式
    actualVariables = variables
    actualLang = lang || (typeof window !== 'undefined' ? getUserLanguage() : 'en')
  }
  
  const dict = dictionaries[actualLang] || en
  let translation = dict[key]
  
  // 変数置換: {{variable}} を実際の値に置換
  if (actualVariables) {
    Object.entries(actualVariables).forEach(([varKey, varValue]) => {
      const placeholder = `{{${varKey}}}`
      translation = translation.replace(new RegExp(placeholder, 'g'), String(varValue))
    })
  }
  
  return translation
}

export function getDictionary(lang: SupportedLanguage): Dictionary {
  return dictionaries[lang] || en
}


