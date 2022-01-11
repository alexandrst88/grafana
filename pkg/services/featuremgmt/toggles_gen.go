// NOTE: This file is autogenerated

package featuremgmt

// RecordedQueries checks for the flag: recordedQueries
// Supports saving queries that can be scraped by prometheus
func (ft *FeatureToggles) IsRecordedQueriesEnabled() bool {
	return ft.manager.IsEnabled("recordedQueries")
}

// Teamsync checks for the flag: teamsync
// Team sync
func (ft *FeatureToggles) IsTeamsyncEnabled() bool {
	return ft.manager.IsEnabled("teamsync")
}

// Ldapsync checks for the flag: ldapsync
// LDAP sync
func (ft *FeatureToggles) IsLdapsyncEnabled() bool {
	return ft.manager.IsEnabled("ldapsync")
}

// Caching checks for the flag: caching
// Caching
func (ft *FeatureToggles) IsCachingEnabled() bool {
	return ft.manager.IsEnabled("caching")
}

// Dspermissions checks for the flag: dspermissions
// Data source permissions
func (ft *FeatureToggles) IsDspermissionsEnabled() bool {
	return ft.manager.IsEnabled("dspermissions")
}

// Analytics checks for the flag: analytics
// Analytics
func (ft *FeatureToggles) IsAnalyticsEnabled() bool {
	return ft.manager.IsEnabled("analytics")
}

// EnterprisePlugins checks for the flag: enterprise.plugins
// Enterprise plugins
func (ft *FeatureToggles) IsEnterprisePluginsEnabled() bool {
	return ft.manager.IsEnabled("enterprise.plugins")
}

// TrimDefaults checks for the flag: trimDefaults
// Use cue schema to remove values that will be applied automatically
func (ft *FeatureToggles) IsTrimDefaultsEnabled() bool {
	return ft.manager.IsEnabled("trimDefaults")
}

// EnvelopeEncryption checks for the flag: envelopeEncryption
// encrypt secrets
func (ft *FeatureToggles) IsEnvelopeEncryptionEnabled() bool {
	return ft.manager.IsEnabled("envelopeEncryption")
}

// HttpclientproviderAzureAuth checks for the flag: httpclientprovider_azure_auth
func (ft *FeatureToggles) IsHttpclientproviderAzureAuthEnabled() bool {
	return ft.manager.IsEnabled("httpclientprovider_azure_auth")
}

// ServiceAccounts checks for the flag: service-accounts
// support service accounts
func (ft *FeatureToggles) IsServiceAccountsEnabled() bool {
	return ft.manager.IsEnabled("service-accounts")
}

// DatabaseMetrics checks for the flag: database_metrics
// Add prometheus metrics for database tables
func (ft *FeatureToggles) IsDatabaseMetricsEnabled() bool {
	return ft.manager.IsEnabled("database_metrics")
}

// DashboardPreviews checks for the flag: dashboardPreviews
// support showing thumbnails id dashboard search results
func (ft *FeatureToggles) IsDashboardPreviewsEnabled() bool {
	return ft.manager.IsEnabled("dashboardPreviews")
}

// LiveConfig checks for the flag: live-config
// live should be able to save configs to SQL tables
func (ft *FeatureToggles) IsLiveConfigEnabled() bool {
	return ft.manager.IsEnabled("live-config")
}

// LivePipeline checks for the flag: live-pipeline
// enable a generic live processing pipeline
func (ft *FeatureToggles) IsLivePipelineEnabled() bool {
	return ft.manager.IsEnabled("live-pipeline")
}

// LiveServiceWebWorker checks for the flag: live-service-web-worker
// This will use a webworker thread to processes events rather than the main thread
func (ft *FeatureToggles) IsLiveServiceWebWorkerEnabled() bool {
	return ft.manager.IsEnabled("live-service-web-worker")
}

// QueryOverLive checks for the flag: queryOverLive
// Send queries over live websocket rather than HTTP requests
func (ft *FeatureToggles) IsQueryOverLiveEnabled() bool {
	return ft.manager.IsEnabled("queryOverLive")
}

// TempoSearch checks for the flag: tempoSearch
// enable searching in tempo datasources
func (ft *FeatureToggles) IsTempoSearchEnabled() bool {
	return ft.manager.IsEnabled("tempoSearch")
}

// TempoBackendSearch checks for the flag: tempoBackendSearch
// use backend for tempo search
func (ft *FeatureToggles) IsTempoBackendSearchEnabled() bool {
	return ft.manager.IsEnabled("tempoBackendSearch")
}

// TempoServiceGraph checks for the flag: tempoServiceGraph
// show service
func (ft *FeatureToggles) IsTempoServiceGraphEnabled() bool {
	return ft.manager.IsEnabled("tempoServiceGraph")
}

// FullRangeLogsVolume checks for the flag: fullRangeLogsVolume
// Show full range logs volume in expore
func (ft *FeatureToggles) IsFullRangeLogsVolumeEnabled() bool {
	return ft.manager.IsEnabled("fullRangeLogsVolume")
}

// Accesscontrol checks for the flag: accesscontrol
// Support robust access control
func (ft *FeatureToggles) IsAccesscontrolEnabled() bool {
	return ft.manager.IsEnabled("accesscontrol")
}

// PrometheusAzureAuth checks for the flag: prometheus_azure_auth
// Use azure authentication for prometheus datasource
func (ft *FeatureToggles) IsPrometheusAzureAuthEnabled() bool {
	return ft.manager.IsEnabled("prometheus_azure_auth")
}

// NewNavigation checks for the flag: newNavigation
// Try the next gen naviation model
func (ft *FeatureToggles) IsNewNavigationEnabled() bool {
	return ft.manager.IsEnabled("newNavigation")
}

// ShowFeatureFlagsInUI checks for the flag: showFeatureFlagsInUI
// Show feature flags in the settings UI
func (ft *FeatureToggles) IsShowFeatureFlagsInUIEnabled() bool {
	return ft.manager.IsEnabled("showFeatureFlagsInUI")
}

// DisableHttpRequestHistogram checks for the flag: disable_http_request_histogram
func (ft *FeatureToggles) IsDisableHttpRequestHistogramEnabled() bool {
	return ft.manager.IsEnabled("disable_http_request_histogram")
}
