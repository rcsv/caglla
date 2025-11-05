import { getUserLanguage } from '@/lib/utils/language'
import type { SupportedLanguage } from '@/lib/core/types'

export type TranslationKey =
  | 'features'
  | 'pricing'
  | 'contact'
  | 'login'
  | 'travelGuide'
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
  | 'nav.logout'
  | 'nav.dayPrefix'
  // Common
  | 'common.close'
  | 'common.deleteFailed'
  | 'common.deleteError'
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
  | 'routeCost.failed'
  | 'routeCost.suggestion'
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
  // Image Upload
  | 'imageUpload.invalidFile'
  | 'imageUpload.loginRequired'
  | 'imageUpload.userIdNotFound'
  | 'imageUpload.userInfoNotFound'
  | 'imageUpload.uploadFailed'
  | 'imageUpload.unknownError'
  | 'imageUpload.uploading'
  | 'imageUpload.selectAnother'
  | 'imageUpload.dropHere'
  | 'imageUpload.clickOrDrag'
  // Image Gallery
  | 'gallery.previousImage'
  | 'gallery.nextImage'
  | 'gallery.cached'
  | 'gallery.photosOf'
  // POI Dialog
  | 'poi.website'
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
  // Travel Cost Display
  | 'cost.title'
  | 'cost.empty'
  | 'cost.empty.description'
  | 'cost.items'
  | 'cost.total'
  | 'cost.hint.edit'
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
  | 'trip.create.advancedSettings'
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

type Dictionary = Record<TranslationKey, string>

const en: Dictionary = {
  features: 'Features',
  pricing: 'Pricing',
  contact: 'Contact',
  login: 'Log in',
  travelGuide: 'Travel Guide',
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
  'home.dashboard.upcomingTrips.title': 'Upcoming Trips',
  'home.dashboard.upcomingTrips.count': '{count} trips',
  'home.dashboard.upcomingTrips.viewAll': 'View All Trip Plans',
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
  'trip.schedule.categorySelect': 'Select Category',
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
  // Navigation
  'nav.summary': 'Summary',
  'nav.itinerary': 'Itinerary',
  'nav.checklist': 'Checklist',
  'nav.plan': 'Plan',
  'nav.logout': 'Logout',
  'nav.dayPrefix': 'Day',
  // Common
  'common.close': 'Close',
  'common.deleteFailed': 'Failed to delete',
  'common.deleteError': 'An error occurred while deleting',
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
  'routeCost.failed': 'Failed to fetch cost estimate',
  'routeCost.suggestion': 'Cost reduction suggestions:',
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
  // Image Upload
  'imageUpload.invalidFile': 'Invalid file',
  'imageUpload.loginRequired': 'Login required',
  'imageUpload.userIdNotFound': 'User ID not found. Please log in again.',
  'imageUpload.userInfoNotFound': 'User information not found. Please log in again.',
  'imageUpload.uploadFailed': 'Failed to upload image: {error}',
  'imageUpload.unknownError': 'An unknown error occurred',
  'imageUpload.uploading': 'Uploading...',
  'imageUpload.selectAnother': 'Select another image',
  'imageUpload.dropHere': 'Drop image here',
  'imageUpload.clickOrDrag': 'Click or drag & drop to upload',
  // Image Gallery
  'gallery.previousImage': 'Previous image',
  'gallery.nextImage': 'Next image',
  'gallery.cached': 'Cached',
  'gallery.photosOf': '{name} photos',
  // Activity Categories (minimal set; fallback supported)
  'activity.primary.transportation': 'Transportation',
  'activity.primaryShort.transportation': 'Transport',
  'activity.secondary.transportation.flight': 'Flight',
  'activity.secondary.transportation.train': 'Train',
  // Travel Cost Display
  'cost.title': 'Travel Cost',
  'cost.empty': 'No schedules with cost information',
  'cost.empty.description': 'Add costs to your schedules to display total cost',
  'cost.items': ' items',
  'cost.total': 'Total',
  'cost.hint.edit': 'Click on any schedule\'s cost to edit',
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
  'trip.create.advancedSettings': 'Advanced Settings',
  'trip.create.title.label': 'Trip Title (destination will be used if left blank)',
  'trip.create.title.placeholder': 'e.g., Okinawa Trip (destination will be used if left blank)',
  'trip.create.description.label': 'Description',
  'trip.create.description.placeholder': 'Enter trip details and purpose',
  'trip.create.imageLoading': 'Auto-fetching destination-related image...',
  'trip.create.imageLoaded': 'Destination-related image auto-fetched',
  'trip.create.accessLevel.label': 'Access Settings',
  'trip.create.accessLevel.private.label': 'Private (only you and shared users)',
  'trip.create.accessLevel.private.description': 'This trip can only be viewed by you and shared users',
  'trip.create.accessLevel.public.description': 'This trip can be viewed by anyone',
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
  'reservation.validation.airportCode': 'Airport code must be 3 uppercase letters (e.g., NRT, HND)',
  'reservation.validation.flightNumber': 'Flight number must be airline code + numbers (e.g., ANA123, JAL456)',
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
  travelGuide: 'トラベルガイド',
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
  'home.dashboard.upcomingTrips.title': '計画中の旅行',
  'home.dashboard.upcomingTrips.count': '{count}件',
  'home.dashboard.upcomingTrips.viewAll': 'すべての旅行プラン',
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
  'trip.schedule.categorySelect': 'カテゴリー選択',
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
  // Navigation
  'nav.summary': '概要',
  'nav.itinerary': '日程',
  'nav.checklist': 'チェックリスト',
  'nav.plan': 'プラン',
  'nav.logout': 'ログアウト',
  'nav.dayPrefix': 'Day',
  // Common
  'common.close': '閉じる',
  'common.deleteFailed': '削除に失敗しました',
  'common.deleteError': '削除中にエラーが発生しました',
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
  'routeCost.failed': 'コスト見積もりの取得に失敗しました',
  'routeCost.suggestion': 'コスト削減の提案:',
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
  // Image Upload
  'imageUpload.invalidFile': '無効なファイルです',
  'imageUpload.loginRequired': 'ログインが必要です',
  'imageUpload.userIdNotFound': 'ユーザーIDが取得できません。ログインし直してください。',
  'imageUpload.userInfoNotFound': 'ユーザー情報が取得できません。ログインし直してください。',
  'imageUpload.uploadFailed': '画像のアップロードに失敗しました: {error}',
  'imageUpload.unknownError': '不明なエラーが発生しました',
  'imageUpload.uploading': 'アップロード中...',
  'imageUpload.selectAnother': '別の画像を選択',
  'imageUpload.dropHere': 'ここに画像をドロップ',
  'imageUpload.clickOrDrag': '画像をクリックまたはドラッグ&ドロップしてアップロード',
  // Image Gallery
  'gallery.previousImage': '前の画像',
  'gallery.nextImage': '次の画像',
  'gallery.cached': 'キャッシュ済み',
  'gallery.photosOf': '{name} の写真',
  // Activity Categories (minimal set; fallback supported)
  'activity.primary.transportation': '乗り物',
  'activity.primaryShort.transportation': '乗り物',
  'activity.secondary.transportation.flight': '飛行機',
  'activity.secondary.transportation.train': '電車',
  // Travel Cost Display
  'cost.title': '旅行費用',
  'cost.empty': '費用情報が設定されたスケジュールがありません',
  'cost.empty.description': '各スケジュールに費用を設定すると、総費用が表示されます',
  'cost.items': '件',
  'cost.total': '合計',
  'cost.hint.edit': '各スケジュールの費用をクリックして編集できます',
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
  'trip.create.advancedSettings': '詳細設定',
  'trip.create.title.label': '旅行のタイトル（未入力時は目的地が使用されます）',
  'trip.create.title.placeholder': '例: 沖縄旅行（空欄の場合は目的地が使用されます）',
  'trip.create.description.label': '説明',
  'trip.create.description.placeholder': '旅行の詳細や目的を記入してください',
  'trip.create.imageLoading': '目的地に関連する画像を自動取得中...',
  'trip.create.imageLoaded': '目的地に関連する画像を自動取得しました',
  'trip.create.accessLevel.label': '公開設定',
  'trip.create.accessLevel.private.label': '非公開（自分と共有ユーザーのみ）',
  'trip.create.accessLevel.private.description': 'この旅行は自分と共有ユーザーのみが閲覧できます',
  'trip.create.accessLevel.public.description': 'この旅行は誰でも閲覧できます',
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
  'reservation.validation.airportCode': '空港コードは3文字の英大文字で入力してください（例: NRT, HND）',
  'reservation.validation.flightNumber': '便名は航空会社コード+数字の形式で入力してください（例: ANA123, JAL456）',
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

export function t(key: TranslationKey, lang?: SupportedLanguage): string {
  const language = lang || (typeof window !== 'undefined' ? getUserLanguage() : 'en')
  const dict = dictionaries[language] || en
  return dict[key]
}

export function getDictionary(lang: SupportedLanguage): Dictionary {
  return dictionaries[lang] || en
}


