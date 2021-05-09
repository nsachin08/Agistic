App = {
    loading: false,
    contracts: {},
    load: async () => {
        await App.loadWeb3()
        await App.loadAccount()
        await App.render()
        await App.loadContract()
    },
    
    loadWeb3: async () => {
        if (typeof web3 !== 'undefined') {
          App.web3Provider = web3.currentProvider
          web3 = new Web3(web3.currentProvider)
        } else {
          window.alert("Please connect to Metamask.")
        }
        // Modern dapp browsers...
        if (window.ethereum) {
          window.web3 = new Web3(ethereum)
          try {
            // Request account access if needed
            await ethereum.enable()
            // Acccounts now exposed
            web3.eth.sendTransaction({/* ... */})
          } catch (error) {
            // User denied account access...
          }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
          App.web3Provider = web3.currentProvider
          window.web3 = new Web3(web3.currentProvider)
          // Acccounts always exposed
          web3.eth.sendTransaction({/* ... */})
        }
        // Non-dapp browsers...
        else {
          console.log('Non-Ethereum browser detected. You should consider trying MetaMask!')
        }
      },

      loadAccount: async () =>{
          App.account = (await web3.eth.getAccounts())[0];
          
      },

      loadContract: async () => {
        //var contract = required("truffle-contract");
        const supplychain = await $.getJSON('SupplyChain.json');
        App.contracts.SupplyChain = TruffleContract(supplychain)
        App.contracts.SupplyChain = setProvider(App.web3Provider)
        App.supplychain = await App.contracts.SupplyChain.deployed()
      },

      render: async () => {
        // var tag_id = document.getElementById('account');
        // tag_id.innerHTML = 'HTML string';
        if (App.loading) {
          return
        }
    
        // Update app loading state
        App.setLoading(true)
    
        // Render Account
        $('#account').html(App.account)
        await App.renderTasks()
    
        // Update loading state
        App.setLoading(false)
      },

      createChain: async() =>{
        App.setLoading=true;
        const name = $('#newName').val()
        const date = $('#date_today').val()
        await App.supplychain.newItem(name, date)
        window.location.reload()
      },

      searchProduct: async() =>{
        App.setLoading=true;
        const name = $('#ProductID').val();
        await App.supplychain.searchProduct(name);
        window.location.reload()
      },

      addState: async() =>{
        App.setLoading=true;
        const id = $('#scan_id').val()
        const location = $('#scan_location').val()
        const date = $('#scan_date').val()
        await App.supplychain.addState(id, location, date)
        window.location.reload()
      },   
      
      setLoading: (boolean) => {
        App.loading = boolean
        const loader = $('#loader')
        const content = $('#content')
        if (boolean) {
          loader.show()
          content.hide()
        } else {
          loader.hide()
          content.show()
        }
      }
}

$(() => {
    $(window).load(() => {
        App.load()
    })
})

// window.onload(App.load())
