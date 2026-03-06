import frappe
from erpnext.stock.doctype.delivery_note.delivery_note import make_sales_invoice


def auto_create_sales_invoice_on_submit(doc, method):
	"""
	On Delivery Note submit, auto-create and submit a Sales Invoice
	if the linked Sales Order is a WooCommerce order and the
	WooCommerce Server has auto_create_sales_invoice enabled.
	"""
	# Get unique WooCommerce servers from DN items linked to Sales Orders
	wc_servers = set()
	for item in doc.items:
		if item.against_sales_order:
			wc_server = frappe.db.get_value(
				"Sales Order", item.against_sales_order, "woocommerce_server"
			)
			if wc_server:
				wc_servers.add(wc_server)

	if not wc_servers:
		return

	# Check if any linked WooCommerce Server has auto_create_sales_invoice enabled
	should_create = any(
		frappe.db.get_value("WooCommerce Server", server, "auto_create_sales_invoice")
		for server in wc_servers
	)

	if not should_create:
		return

	si = make_sales_invoice(doc.name)
	si.flags.ignore_mandatory = True
	si.insert()
	si.submit()
